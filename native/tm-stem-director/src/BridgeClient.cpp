#include "BridgeClient.h"

#include <cctype>
#include <cerrno>
#include <cstdlib>
#include <cstring>
#include <exception>
#include <sstream>
#include <utility>

#ifdef _WIN32
#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#include <winsock2.h>
#include <ws2tcpip.h>
#else
#include <arpa/inet.h>
#include <fcntl.h>
#include <netinet/in.h>
#include <sys/select.h>
#include <sys/socket.h>
#include <unistd.h>
#endif

namespace tmstem {
namespace {

#ifdef _WIN32
using socket_t = SOCKET;
constexpr socket_t kInvalidSocket = INVALID_SOCKET;
#else
using socket_t = int;
constexpr socket_t kInvalidSocket = -1;
#endif

void ensureSockets() {
#ifdef _WIN32
    static bool started = false;
    if (!started) {
        WSADATA data;
        if (WSAStartup(MAKEWORD(2, 2), &data) == 0) started = true;
    }
#else
    (void)0;
#endif
}

std::string lastSocketError() {
#ifdef _WIN32
    return "winsock " + std::to_string(WSAGetLastError());
#else
    return std::strerror(errno);
#endif
}

void closeSocket(socket_t fd) {
    if (fd == kInvalidSocket) return;
#ifdef _WIN32
    closesocket(fd);
#else
    ::close(fd);
#endif
}

void setTimeouts(socket_t fd, int milliseconds) {
#ifdef _WIN32
    DWORD timeout = static_cast<DWORD>(milliseconds);
    setsockopt(fd, SOL_SOCKET, SO_RCVTIMEO, reinterpret_cast<const char*>(&timeout), sizeof(timeout));
    setsockopt(fd, SOL_SOCKET, SO_SNDTIMEO, reinterpret_cast<const char*>(&timeout), sizeof(timeout));
#else
    timeval timeout{};
    timeout.tv_sec = milliseconds / 1000;
    timeout.tv_usec = (milliseconds % 1000) * 1000;
    setsockopt(fd, SOL_SOCKET, SO_RCVTIMEO, &timeout, sizeof(timeout));
    setsockopt(fd, SOL_SOCKET, SO_SNDTIMEO, &timeout, sizeof(timeout));
#endif
}

bool setNonBlocking(socket_t fd, bool enabled) {
#ifdef _WIN32
    u_long mode = enabled ? 1 : 0;
    return ioctlsocket(fd, FIONBIO, &mode) == 0;
#else
    int flags = fcntl(fd, F_GETFL, 0);
    if (flags < 0) return false;
    if (enabled) flags |= O_NONBLOCK;
    else flags &= ~O_NONBLOCK;
    return fcntl(fd, F_SETFL, flags) == 0;
#endif
}

bool connectLoopback(int port, socket_t& out, std::string& error) {
    ensureSockets();
    out = kInvalidSocket;
    socket_t fd = ::socket(AF_INET, SOCK_STREAM, 0);
    if (fd == kInvalidSocket) {
        error = "socket failed: " + lastSocketError();
        return false;
    }
    sockaddr_in address{};
    address.sin_family = AF_INET;
    address.sin_port = htons(static_cast<uint16_t>(port));
    if (inet_pton(AF_INET, "127.0.0.1", &address.sin_addr) != 1) {
        closeSocket(fd);
        error = "loopback address failed";
        return false;
    }
    if (!setNonBlocking(fd, true)) {
        closeSocket(fd);
        error = "socket mode failed: " + lastSocketError();
        return false;
    }
    int connected = ::connect(fd, reinterpret_cast<sockaddr*>(&address), sizeof(address));
    if (connected != 0) {
#ifdef _WIN32
        int code = WSAGetLastError();
        bool pending = code == WSAEWOULDBLOCK || code == WSAEINPROGRESS;
#else
        bool pending = errno == EINPROGRESS || errno == EWOULDBLOCK;
#endif
        if (!pending) {
            error = "connect failed: " + lastSocketError();
            closeSocket(fd);
            return false;
        }
        fd_set writeSet;
        FD_ZERO(&writeSet);
        FD_SET(fd, &writeSet);
        timeval wait{};
        wait.tv_sec = 2;
        wait.tv_usec = 0;
        int selected = ::select(static_cast<int>(fd) + 1, nullptr, &writeSet, nullptr, &wait);
        if (selected <= 0) {
            error = selected == 0 ? "connect failed: timeout" : "connect failed: " + lastSocketError();
            closeSocket(fd);
            return false;
        }
        int soError = 0;
        socklen_t length = sizeof(soError);
        getsockopt(fd, SOL_SOCKET, SO_ERROR, reinterpret_cast<char*>(&soError), &length);
        if (soError != 0) {
#ifdef _WIN32
            error = "connect failed: winsock " + std::to_string(soError);
#else
            error = std::string("connect failed: ") + std::strerror(soError);
#endif
            closeSocket(fd);
            return false;
        }
    }
    if (!setNonBlocking(fd, false)) {
        closeSocket(fd);
        error = "socket mode failed: " + lastSocketError();
        return false;
    }
    setTimeouts(fd, 5000);
    out = fd;
    return true;
}

bool sendAll(socket_t fd, const std::string& data, std::string& error) {
    std::size_t sentTotal = 0;
    while (sentTotal < data.size()) {
#ifdef _WIN32
        int sent = ::send(fd, data.data() + sentTotal, static_cast<int>(data.size() - sentTotal), 0);
#else
        ssize_t sent = ::send(fd, data.data() + sentTotal, data.size() - sentTotal, 0);
#endif
        if (sent <= 0) {
            error = "send failed: " + lastSocketError();
            return false;
        }
        sentTotal += static_cast<std::size_t>(sent);
    }
    return true;
}

bool readSome(socket_t fd, std::string& data, std::string& error) {
    char buffer[4096];
#ifdef _WIN32
    int count = ::recv(fd, buffer, sizeof(buffer), 0);
#else
    ssize_t count = ::recv(fd, buffer, sizeof(buffer), 0);
#endif
    if (count < 0) {
        error = "read failed: " + lastSocketError();
        return false;
    }
    if (count == 0) return true;
    data.append(buffer, buffer + count);
    return true;
}

bool readResponse(socket_t fd, int& status, std::string& body, std::string& error) {
    std::string raw;
    while (raw.find("\r\n\r\n") == std::string::npos) {
        std::size_t before = raw.size();
        if (!readSome(fd, raw, error)) return false;
        if (raw.size() == before) {
            error = "connection closed before the HTTP header finished";
            return false;
        }
        if (raw.size() > 1024 * 1024) {
            error = "HTTP header is too large";
            return false;
        }
    }
    const std::size_t split = raw.find("\r\n\r\n");
    const std::string header = raw.substr(0, split);
    body = raw.substr(split + 4);
    status = 0;
    const std::size_t space = header.find(' ');
    if (header.rfind("HTTP/", 0) == 0 && space != std::string::npos) {
        status = std::atoi(header.c_str() + space + 1);
    }
    std::size_t contentLength = static_cast<std::size_t>(-1);
    std::istringstream lines(header);
    std::string line;
    while (std::getline(lines, line)) {
        if (!line.empty() && line.back() == '\r') line.pop_back();
        const std::string prefix = "content-length:";
        std::string lower = line;
        for (char& character : lower) character = static_cast<char>(std::tolower(static_cast<unsigned char>(character)));
        if (lower.rfind(prefix, 0) == 0) {
            contentLength = static_cast<std::size_t>(std::strtoul(line.c_str() + prefix.size(), nullptr, 10));
        }
    }
    if (contentLength == static_cast<std::size_t>(-1)) {
        while (body.size() < 2 * 1024 * 1024) {
            std::size_t before = body.size();
            if (!readSome(fd, body, error)) return false;
            if (body.size() == before) return true;
        }
        error = "HTTP body is too large";
        return false;
    }
    if (contentLength > 64 * 1024 * 1024) {
        error = "HTTP body is too large";
        return false;
    }
    while (body.size() < contentLength) {
        std::size_t before = body.size();
        if (!readSome(fd, body, error)) return false;
        if (body.size() == before) {
            error = "connection closed before the HTTP body finished";
            return false;
        }
    }
    body.resize(contentLength);
    return true;
}

bool safeJobId(const std::string& jobId) {
    if (jobId.empty() || jobId.size() > 80) return false;
    for (unsigned char character : jobId) {
        if (!std::isalnum(character) && character != '-') return false;
    }
    return true;
}

class Parser {
public:
    explicit Parser(const std::string& text) : text_(text) {}

    bool parse(Json& out, std::string& error) {
        skip();
        if (!parseValue(out, 0)) {
            error = error_;
            return false;
        }
        skip();
        if (index_ != text_.size()) {
            error = "trailing JSON data";
            return false;
        }
        return true;
    }

private:
    const std::string& text_;
    std::size_t index_ = 0;
    std::string error_ = "invalid JSON";

    void fail(const std::string& message) { if (error_ == "invalid JSON") error_ = message; }

    void skip() {
        while (index_ < text_.size() && std::isspace(static_cast<unsigned char>(text_[index_]))) ++index_;
    }

    bool consume(char expected) {
        skip();
        if (index_ >= text_.size() || text_[index_] != expected) return false;
        ++index_;
        return true;
    }

    bool parseValue(Json& out, int depth) {
        if (depth > 32) {
            fail("JSON is nested too deeply");
            return false;
        }
        skip();
        if (index_ >= text_.size()) {
            fail("unexpected end of JSON");
            return false;
        }
        const char character = text_[index_];
        if (character == '{') return parseObject(out, depth);
        if (character == '[') return parseArray(out, depth);
        if (character == '"') return parseString(out);
        if (character == 't' || character == 'f') return parseBool(out);
        if (character == 'n') return parseNull(out);
        if (character == '-' || std::isdigit(static_cast<unsigned char>(character))) return parseNumber(out);
        fail("unexpected JSON value");
        return false;
    }

    bool parseObject(Json& out, int depth) {
        if (!consume('{')) return false;
        out = Json{};
        out.type = Json::Type::Object;
        skip();
        if (consume('}')) return true;
        while (index_ < text_.size()) {
            Json key;
            if (!parseString(key)) return false;
            if (!consume(':')) {
                fail("JSON object is missing a colon");
                return false;
            }
            Json value;
            if (!parseValue(value, depth + 1)) return false;
            out.object.emplace_back(key.text, std::move(value));
            skip();
            if (consume('}')) return true;
            if (!consume(',')) {
                fail("JSON object is missing a comma");
                return false;
            }
        }
        fail("unterminated JSON object");
        return false;
    }

    bool parseArray(Json& out, int depth) {
        if (!consume('[')) return false;
        out = Json{};
        out.type = Json::Type::Array;
        skip();
        if (consume(']')) return true;
        while (index_ < text_.size()) {
            Json value;
            if (!parseValue(value, depth + 1)) return false;
            out.array.push_back(std::move(value));
            skip();
            if (consume(']')) return true;
            if (!consume(',')) {
                fail("JSON array is missing a comma");
                return false;
            }
        }
        fail("unterminated JSON array");
        return false;
    }

    bool parseString(Json& out) {
        if (!consume('"')) return false;
        std::string value;
        while (index_ < text_.size()) {
            const char character = text_[index_++];
            if (character == '"') {
                out = Json{};
                out.type = Json::Type::String;
                out.text = std::move(value);
                return true;
            }
            if (character == '\\') {
                if (index_ >= text_.size()) break;
                const char escaped = text_[index_++];
                switch (escaped) {
                    case '"':
                    case '\\':
                    case '/': value.push_back(escaped); break;
                    case 'b': value.push_back('\b'); break;
                    case 'f': value.push_back('\f'); break;
                    case 'n': value.push_back('\n'); break;
                    case 'r': value.push_back('\r'); break;
                    case 't': value.push_back('\t'); break;
                    case 'u':
                        if (!appendUnicode(value)) return false;
                        break;
                    default:
                        fail("invalid JSON escape");
                        return false;
                }
            } else if (static_cast<unsigned char>(character) < 0x20) {
                fail("raw control character in JSON string");
                return false;
            } else {
                value.push_back(character);
            }
        }
        fail("unterminated JSON string");
        return false;
    }

    bool appendUnicode(std::string& value) {
        if (index_ + 4 > text_.size()) {
            fail("short JSON unicode escape");
            return false;
        }
        int code = 0;
        for (int i = 0; i < 4; ++i) {
            const char digit = text_[index_++];
            code <<= 4;
            if (digit >= '0' && digit <= '9') code += digit - '0';
            else if (digit >= 'a' && digit <= 'f') code += digit - 'a' + 10;
            else if (digit >= 'A' && digit <= 'F') code += digit - 'A' + 10;
            else {
                fail("invalid JSON unicode escape");
                return false;
            }
        }
        if (code >= 0xD800 && code <= 0xDBFF && index_ + 6 <= text_.size() && text_[index_] == '\\' && text_[index_ + 1] == 'u') {
            index_ += 2;
            int low = 0;
            for (int i = 0; i < 4; ++i) {
                const char digit = text_[index_++];
                low <<= 4;
                if (digit >= '0' && digit <= '9') low += digit - '0';
                else if (digit >= 'a' && digit <= 'f') low += digit - 'a' + 10;
                else if (digit >= 'A' && digit <= 'F') low += digit - 'A' + 10;
                else {
                    fail("invalid JSON surrogate");
                    return false;
                }
            }
            if (low < 0xDC00 || low > 0xDFFF) {
                fail("invalid JSON surrogate");
                return false;
            }
            code = 0x10000 + (((code - 0xD800) << 10) | (low - 0xDC00));
        }
        appendUtf8(value, code);
        return true;
    }

    static void appendUtf8(std::string& value, int code) {
        if (code < 0 || code > 0x10FFFF) return;
        if (code <= 0x7F) value.push_back(static_cast<char>(code));
        else if (code <= 0x7FF) {
            value.push_back(static_cast<char>(0xC0 | (code >> 6)));
            value.push_back(static_cast<char>(0x80 | (code & 0x3F)));
        } else if (code <= 0xFFFF) {
            value.push_back(static_cast<char>(0xE0 | (code >> 12)));
            value.push_back(static_cast<char>(0x80 | ((code >> 6) & 0x3F)));
            value.push_back(static_cast<char>(0x80 | (code & 0x3F)));
        } else {
            value.push_back(static_cast<char>(0xF0 | (code >> 18)));
            value.push_back(static_cast<char>(0x80 | ((code >> 12) & 0x3F)));
            value.push_back(static_cast<char>(0x80 | ((code >> 6) & 0x3F)));
            value.push_back(static_cast<char>(0x80 | (code & 0x3F)));
        }
    }

    bool parseBool(Json& out) {
        if (text_.compare(index_, 4, "true") == 0) {
            index_ += 4;
            out = Json{};
            out.type = Json::Type::Bool;
            out.boolean = true;
            return true;
        }
        if (text_.compare(index_, 5, "false") == 0) {
            index_ += 5;
            out = Json{};
            out.type = Json::Type::Bool;
            out.boolean = false;
            return true;
        }
        fail("invalid JSON boolean");
        return false;
    }

    bool parseNull(Json& out) {
        if (text_.compare(index_, 4, "null") != 0) {
            fail("invalid JSON null");
            return false;
        }
        index_ += 4;
        out = Json{};
        out.type = Json::Type::Null;
        return true;
    }

    bool parseNumber(Json& out) {
        const std::size_t start = index_;
        if (text_[index_] == '-') ++index_;
        if (index_ >= text_.size() || !std::isdigit(static_cast<unsigned char>(text_[index_]))) {
            fail("invalid JSON number");
            return false;
        }
        if (text_[index_] == '0') ++index_;
        else while (index_ < text_.size() && std::isdigit(static_cast<unsigned char>(text_[index_]))) ++index_;
        if (index_ < text_.size() && text_[index_] == '.') {
            ++index_;
            if (index_ >= text_.size() || !std::isdigit(static_cast<unsigned char>(text_[index_]))) {
                fail("invalid JSON number");
                return false;
            }
            while (index_ < text_.size() && std::isdigit(static_cast<unsigned char>(text_[index_]))) ++index_;
        }
        if (index_ < text_.size() && (text_[index_] == 'e' || text_[index_] == 'E')) {
            ++index_;
            if (index_ < text_.size() && (text_[index_] == '+' || text_[index_] == '-')) ++index_;
            if (index_ >= text_.size() || !std::isdigit(static_cast<unsigned char>(text_[index_]))) {
                fail("invalid JSON exponent");
                return false;
            }
            while (index_ < text_.size() && std::isdigit(static_cast<unsigned char>(text_[index_]))) ++index_;
        }
        try {
            out = Json{};
            out.type = Json::Type::Number;
            out.number = std::stod(text_.substr(start, index_ - start));
        } catch (const std::exception&) {
            fail("JSON number is out of range");
            return false;
        }
        return true;
    }
};

HttpResult httpError(const std::string& message) {
    HttpResult result;
    result.error = message;
    return result;
}

}  // namespace

const Json* Json::find(const std::string& key) const {
    if (type == Type::Object) {
        for (const auto& entry : object) {
            if (entry.first == key) return &entry.second;
        }
        for (const auto& entry : object) {
            if (const Json* nested = entry.second.find(key)) return nested;
        }
    } else if (type == Type::Array) {
        for (const auto& entry : array) {
            if (const Json* nested = entry.find(key)) return nested;
        }
    }
    return nullptr;
}

bool isPermittedHost(const std::string& host) { return host == "127.0.0.1"; }

std::string jsonEscape(const std::string& value) {
    std::string out;
    out.reserve(value.size() + 8);
    for (unsigned char character : value) {
        switch (character) {
            case '"': out += "\\\""; break;
            case '\\': out += "\\\\"; break;
            case '\n': out += "\\n"; break;
            case '\r': out += "\\r"; break;
            case '\t': out += "\\t"; break;
            default:
                if (character < 0x20) {
                    constexpr char hex[] = "0123456789abcdef";
                    out += "\\u00";
                    out.push_back(hex[character >> 4]);
                    out.push_back(hex[character & 0x0F]);
                } else {
                    out.push_back(static_cast<char>(character));
                }
        }
    }
    return out;
}

std::string audioRequestBody(const std::string& path) { return "{\"audio\":\"" + jsonEscape(path) + "\"}"; }

bool parseJson(const std::string& text, Json& out, std::string& error) { return Parser(text).parse(out, error); }

bool jsonStringField(const std::string& text, const std::string& key, std::string& out, std::string& error) {
    Json json;
    if (!parseJson(text, json, error)) return false;
    const Json* field = json.find(key);
    if (field == nullptr || field->type != Json::Type::String) {
        error = "missing string field " + key;
        return false;
    }
    out = field->text;
    return true;
}

BridgeClient::BridgeClient(std::string host, int port, std::string token)
    : host_(std::move(host)), port_(port), token_(std::move(token)) {}

HttpResult BridgeClient::refused() const {
    return httpError("Refusing host; TM Stem Director client only contacts 127.0.0.1");
}

HttpResult BridgeClient::health() const { return request("GET", "/health", ""); }

HttpResult BridgeClient::submit(const std::string& audioPath) const {
    if (audioPath.empty()) return httpError("audio path is empty");
    return request("POST", "/jobs", audioRequestBody(audioPath));
}

HttpResult BridgeClient::status(const std::string& jobId) const {
    if (!isPermittedHost(host_)) return refused();
    if (!safeJobId(jobId)) return httpError("invalid job id");
    return request("GET", "/jobs/" + jobId, "");
}

HttpResult BridgeClient::cancel(const std::string& jobId) const {
    if (!isPermittedHost(host_)) return refused();
    if (!safeJobId(jobId)) return httpError("invalid job id");
    return request("POST", "/jobs/" + jobId + "/cancel", "");
}

HttpResult BridgeClient::reveal(const std::string& jobId) const {
    if (!isPermittedHost(host_)) return refused();
    if (!safeJobId(jobId)) return httpError("invalid job id");
    return request("POST", "/jobs/" + jobId + "/reveal", "");
}

HttpResult BridgeClient::request(const std::string& method, const std::string& path, const std::string& body) const {
    if (!isPermittedHost(host_)) return refused();
    if (port_ < 1 || port_ > 65535) return httpError("invalid port");
    socket_t fd = kInvalidSocket;
    std::string error;
    if (!connectLoopback(port_, fd, error)) return httpError(error);
    std::ostringstream message;
    message << method << " " << path << " HTTP/1.1\r\n";
    message << "Host: 127.0.0.1:" << port_ << "\r\n";
    message << "Connection: close\r\n";
    message << "Accept: application/json\r\n";
    if (!token_.empty()) message << "Authorization: Bearer " << token_ << "\r\n";
    if (!body.empty()) {
        message << "Content-Type: application/json\r\n";
        message << "Content-Length: " << body.size() << "\r\n";
    }
    message << "\r\n" << body;
    HttpResult result;
    if (!sendAll(fd, message.str(), error) || !readResponse(fd, result.status, result.body, error)) {
        closeSocket(fd);
        result.error = error;
        return result;
    }
    closeSocket(fd);
    result.ok = result.status >= 200 && result.status < 300;
    if (!result.ok && result.error.empty()) result.error = "HTTP " + std::to_string(result.status);
    return result;
}

}  // namespace tmstem
