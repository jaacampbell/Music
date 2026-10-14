// Never call this process, or BridgeClient, from a realtime audio thread.
// The CLI blocks on loopback sockets while a background job runs elsewhere.

#include "BridgeClient.h"

#include <chrono>
#include <cstdlib>
#include <iostream>
#include <string>
#include <thread>

namespace {

struct Options {
    std::string host = "127.0.0.1";
    int port = 8766;
    std::string token;
    std::string command;
    std::string audio;
    std::string id;
    bool wait = false;
    double interval = 0.5;
    double timeout = 3600;
};

void usage() {
    std::cerr
        << "tm_stem_client [--host 127.0.0.1] [--port 8766] [--token TOKEN]\n"
        << "               [--interval 0.5] [--timeout 3600] [--wait]\n"
        << "               health | submit --audio PATH | status --id UUID |\n"
        << "               cancel --id UUID | reveal --id UUID\n"
        << "Contacts 127.0.0.1 only. Do not call from the audio thread.\n"
        << "This client does not install or replace TM Stem Director.vst3.\n";
}

bool parseArgs(int argc, char** argv, Options& options) {
    for (int index = 1; index < argc; ++index) {
        const std::string arg = argv[index];
        auto need = [&](std::string& out) {
            if (index + 1 >= argc) return false;
            out = argv[++index];
            return true;
        };
        if (arg == "--host") {
            if (!need(options.host)) return false;
        } else if (arg == "--port") {
            std::string value;
            if (!need(value)) return false;
            try {
                options.port = std::stoi(value);
            } catch (const std::exception&) {
                return false;
            }
        } else if (arg == "--token") {
            if (!need(options.token)) return false;
        } else if (arg == "--audio") {
            if (!need(options.audio)) return false;
        } else if (arg == "--id") {
            if (!need(options.id)) return false;
        } else if (arg == "--interval") {
            std::string value;
            if (!need(value)) return false;
            try {
                options.interval = std::stod(value);
            } catch (const std::exception&) {
                return false;
            }
        } else if (arg == "--timeout") {
            std::string value;
            if (!need(value)) return false;
            try {
                options.timeout = std::stod(value);
            } catch (const std::exception&) {
                return false;
            }
        } else if (arg == "--wait") {
            options.wait = true;
        } else if (arg == "--help" || arg == "-h") {
            usage();
            std::exit(0);
        } else if (!arg.empty() && arg[0] == '-') {
            return false;
        } else if (options.command.empty()) {
            options.command = arg;
        } else {
            return false;
        }
    }
    return !options.command.empty();
}

int printResult(const tmstem::HttpResult& result, int successStatus) {
    if (!result.body.empty()) std::cout << result.body << std::endl;
    if (!result.ok || result.status != successStatus) {
        if (!result.error.empty()) std::cerr << result.error << std::endl;
        return result.error.find("Refusing host") != std::string::npos ? 2 : 1;
    }
    return 0;
}

int waitForTerminal(const tmstem::BridgeClient& client, const std::string& jobId, const Options& options) {
    const auto deadline = std::chrono::steady_clock::now() + std::chrono::duration<double>(options.timeout);
    const auto pause = std::chrono::duration<double>(options.interval > 0.05 ? options.interval : 0.05);
    while (std::chrono::steady_clock::now() < deadline) {
        const tmstem::HttpResult result = client.status(jobId);
        if (!result.body.empty()) std::cout << result.body << std::endl;
        if (!result.ok) {
            if (!result.error.empty()) std::cerr << result.error << std::endl;
            return result.error.find("Refusing host") != std::string::npos ? 2 : 1;
        }
        std::string state;
        std::string error;
        if (!tmstem::jsonStringField(result.body, "status", state, error)) {
            std::cerr << error << std::endl;
            return 1;
        }
        if (state == "completed") return 0;
        if (state == "failed" || state == "cancelled") return 1;
        std::this_thread::sleep_for(pause);
    }
    std::cerr << "timed out waiting for the stem job" << std::endl;
    return 1;
}

}  // namespace

int main(int argc, char** argv) {
    Options options;
    if (!parseArgs(argc, argv, options)) {
        usage();
        return 1;
    }
    if (options.token.empty()) {
        if (const char* env = std::getenv("TM_STEM_BRIDGE_TOKEN")) options.token = env;
    }
    if (!tmstem::isPermittedHost(options.host)) {
        std::cerr << "Refusing host; TM Stem Director client only contacts 127.0.0.1" << std::endl;
        return 2;
    }
    tmstem::BridgeClient client(options.host, options.port, options.token);
    if (options.command == "health") return printResult(client.health(), 200);
    if (options.command != "health" && options.token.empty()) {
        std::cerr << "A bridge token is required. Set --token or TM_STEM_BRIDGE_TOKEN." << std::endl;
        return 1;
    }
    if (options.command == "submit") {
        const tmstem::HttpResult created = client.submit(options.audio);
        const int code = printResult(created, 202);
        if (code != 0 || !options.wait) return code;
        std::string jobId;
        std::string error;
        if (!tmstem::jsonStringField(created.body, "id", jobId, error)) {
            std::cerr << error << std::endl;
            return 1;
        }
        return waitForTerminal(client, jobId, options);
    }
    if (options.command == "status") {
        if (options.wait) return waitForTerminal(client, options.id, options);
        return printResult(client.status(options.id), 200);
    }
    if (options.command == "cancel") return printResult(client.cancel(options.id), 202);
    if (options.command == "reveal") return printResult(client.reveal(options.id), 200);
    usage();
    return 1;
}
