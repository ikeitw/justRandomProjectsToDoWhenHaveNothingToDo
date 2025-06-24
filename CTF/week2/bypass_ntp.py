import frida
import sys

EXE_PATH = "patience_2.exe"

def on_message(message, data):
    if message['type'] == 'send':
        print("[*]", message['payload'])
    elif message['type'] == 'error':
        print("[!] Script error:", message['stack'])

def main():
    print("[*] Launching and attaching to process...")
    pid = frida.spawn([EXE_PATH])
    session = frida.attach(pid)

    script = session.create_script("""
        // Hook getaddrinfo if available
        var getaddrinfo_ptr = Module.findExportByName(null, "getaddrinfo");
        if (getaddrinfo_ptr !== null) {
            Interceptor.attach(getaddrinfo_ptr, {
                onEnter: function (args) {
                    var host = Memory.readUtf8String(args[0]);
                    if (host.indexOf("ntp") !== -1) {
                        send("Bypassing NTP DNS: " + host);
                        args[0] = Memory.allocUtf8String("localhost");
                    }
                }
            });
        } else {
            send("getaddrinfo not found.");
        }

        // Hook sendto to block UDP to port 123 (NTP)
        var sendto_ptr = Module.findExportByName(null, "sendto");
        if (sendto_ptr !== null) {
            Interceptor.attach(sendto_ptr, {
                onEnter: function (args) {
                    var port = Memory.readU16(args[5].add(2));
                    if (port === 123) {
                        send("Bypassing NTP sendto to port 123.");
                        this.bypass = true;
                    }
                },
                onLeave: function (retval) {
                    if (this.bypass) {
                        retval.replace(retval); // pretend success
                    }
                }
            });
        } else {
            send("sendto not found.");
        }

        // Spoof GetSystemTimeAsFileTime to return 2025-05-23 09:00:00 UTC
        var gettime_ptr = Module.findExportByName("kernel32.dll", "GetSystemTimeAsFileTime");
        if (gettime_ptr !== null) {
            Interceptor.replace(gettime_ptr, new NativeCallback(function (lpSystemTimeAsFileTime) {
                send("Spoofing time: 2025-05-23 09:00:00 UTC");

                // FILETIME = 133489704000000000 (2025-05-23 09:00:00 UTC)
                var timestamp = 133489704000000000;

                // FILETIME = 64-bit split into two 32-bit little endian values
                Memory.writeU32(lpSystemTimeAsFileTime, timestamp & 0xFFFFFFFF); // Low DWORD
                Memory.writeU32(lpSystemTimeAsFileTime.add(4), timestamp / 0x100000000); // High DWORD
            }, 'void', ['pointer']));
        } else {
            send("GetSystemTimeAsFileTime not found.");
        }
    """)

    script.on('message', on_message)
    script.load()

    frida.resume(pid)
    print("[*] NTP and Time Spoofing injected. Process is running.\nPress Enter to quit...")
    sys.stdin.read()

if __name__ == '__main__':
    main()
