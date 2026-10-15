#include "BridgeClient.h"

#include <iostream>
#include <string>

#ifdef _WIN32
#include <winsock2.h>
#include <ws2tcpip.h>
#else
#include <arpa/inet.h>
#include <netinet/in.h>
#include <sys/socket.h>
#include <unistd.h>
#endif

namespace {

int failures = 0;

void check(bool condition, int line, const char* text) {
    if (!condition) {
        std::cerr << "FAIL " << line << " " << text << "\n";
        ++failures;
    }
}

#define CHECK(condition) check((condition), __LINE__, #condition)

int closedPort() {
#ifdef _WIN32
    WSADATA data;
    WSAStartup(MAKEWORD(2, 2), &data);
    SOCKET fd = ::socket(AF_INET, SOCK_STREAM, 0);
#else
    int fd = ::socket(AF_INET, SOCK_STREAM, 0);
#endif
#ifdef _WIN32
    if (fd == INVALID_SOCKET) return 1;
#else
    if (fd < 0) return 1;
#endif
    sockaddr_in address{};
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = htonl(INADDR_LOOPBACK);
    address.sin_port = htons(0);
    if (::bind(fd, reinterpret_cast<sockaddr*>(&address), sizeof(address)) != 0) {
#ifdef _WIN32
        closesocket(fd);
#else
        ::close(fd);
#endif
        return 1;
    }
    socklen_t length = sizeof(address);
    ::getsockname(fd, reinterpret_cast<sockaddr*>(&address), &length);
    const int port = ntohs(address.sin_port);
#ifdef _WIN32
    closesocket(fd);
#else
    ::close(fd);
#endif
    return port;
}

}  // namespace

int main() {
    CHECK(tmstem::isPermittedHost("127.0.0.1"));
    CHECK(!tmstem::isPermittedHost("localhost"));
    CHECK(!tmstem::isPermittedHost("::1"));
    CHECK(!tmstem::isPermittedHost("0.0.0.0"));
    CHECK(!tmstem::isPermittedHost("127.0.0.2"));
    CHECK(!tmstem::isPermittedHost("127.0.0.1.example"));
    CHECK(!tmstem::isPermittedHost(""));

    const std::string path = "C:\\songs\\\"take\".wav\n";
    const std::string body = tmstem::audioRequestBody(path);
    tmstem::Json json;
    std::string error;
    CHECK(tmstem::parseJson(body, json, error));
    const tmstem::Json* audio = json.find("audio");
    CHECK(audio != nullptr && audio->type == tmstem::Json::Type::String && audio->text == path);

    const std::string document = R"({"id":"abc-1","status":"completed","progress":100,"error":null,"nested":{"status":"hidden"},"duration_seconds":1.5,"note":"line\n"})";
    CHECK(tmstem::parseJson(document, json, error));
    std::string status;
    CHECK(tmstem::jsonStringField(document, "status", status, error));
    CHECK(status == "completed");
    const tmstem::Json* progress = json.find("progress");
    CHECK(progress != nullptr && progress->type == tmstem::Json::Type::Number && progress->number == 100);
    const tmstem::Json* missing = json.find("error");
    CHECK(missing != nullptr && missing->type == tmstem::Json::Type::Null);
    const tmstem::Json* duration = json.find("duration_seconds");
    CHECK(duration != nullptr && duration->number > 1.4 && duration->number < 1.6);
    CHECK(!tmstem::parseJson("{\"audio\":", json, error));

    const char* refusedHosts[] = {"localhost", "::1", "0.0.0.0", "10.0.0.1", "example.com"};
    for (const char* host : refusedHosts) {
        tmstem::BridgeClient client(host, 9, "token");
        const tmstem::HttpResult result = client.health();
        CHECK(!result.ok);
        CHECK(result.error.find("Refusing host") != std::string::npos);
        CHECK(result.error.find("127.0.0.1") != std::string::npos);
    }

    tmstem::BridgeClient remote("10.1.2.3", 9, "token");
    const tmstem::HttpResult cancelled = remote.cancel("job-1");
    CHECK(!cancelled.ok);
    CHECK(cancelled.error.find("Refusing host") != std::string::npos);

    tmstem::BridgeClient local("127.0.0.1", closedPort(), "token");
    const tmstem::HttpResult closed = local.health();
    CHECK(!closed.ok);
    CHECK(closed.error.find("Refusing host") == std::string::npos);
    CHECK(closed.error.find("connect failed") != std::string::npos);

    const tmstem::HttpResult badId = local.cancel("not an id");
    CHECK(!badId.ok);
    CHECK(badId.error.find("invalid job id") != std::string::npos);

    if (failures != 0) {
        std::cerr << failures << " failure(s)\n";
        return 1;
    }
    std::cout << "tm_stem_client tests passed\n";
    return 0;
}
