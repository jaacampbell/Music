#pragma once

// TM Stem Director loopback client.
// Never call from the audio thread. Every method blocks on sockets.
// This is the background-thread contract for a future plugin UI.
// It does not build, install, sign, or replace TM Stem Director.vst3.

#include <string>
#include <utility>
#include <vector>

namespace tmstem {

struct HttpResult {
    bool ok = false;
    int status = 0;
    std::string body;
    std::string error;
};

struct Json {
    enum class Type { Null, Bool, Number, String, Array, Object };
    Type type = Type::Null;
    bool boolean = false;
    double number = 0;
    std::string text;
    std::vector<Json> array;
    std::vector<std::pair<std::string, Json>> object;

    const Json* find(const std::string& key) const;
};

bool isPermittedHost(const std::string& host);
std::string jsonEscape(const std::string& value);
std::string audioRequestBody(const std::string& path);
bool parseJson(const std::string& text, Json& out, std::string& error);
bool jsonStringField(const std::string& text, const std::string& key, std::string& out, std::string& error);

class BridgeClient {
public:
    BridgeClient(std::string host, int port, std::string token);

    HttpResult health() const;
    HttpResult submit(const std::string& audioPath) const;
    HttpResult status(const std::string& jobId) const;
    HttpResult cancel(const std::string& jobId) const;
    HttpResult reveal(const std::string& jobId) const;

private:
    HttpResult request(const std::string& method, const std::string& path, const std::string& body) const;
    HttpResult refused() const;
    std::string host_;
    int port_;
    std::string token_;
};

}  // namespace tmstem
