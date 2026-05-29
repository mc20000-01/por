class PORAdvancedSyncExtension {
    getInfo() {
        return {
            id: "porsync",
            name: "POR Smart Sync",
            color1: "#0366d6",
            color2: "#005cc5",
            blocks: [
                {
                    opcode: "stageTextFile",
                    blockType: Scratch.BlockType.COMMAND,
                    text: "stage plain text [CONTENT] to file [FILE]",
                    arguments: {
                        CONTENT: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: '{"status": "ok"}',
                        },
                        FILE: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "sys/data.json",
                        },
                    },
                },
                {
                    opcode: "stageURLFile",
                    blockType: Scratch.BlockType.COMMAND,
                    text: "stage data URL [CONTENT] to file [FILE]",
                    arguments: {
                        CONTENT: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "data:application/zip;base64,...",
                        },
                        FILE: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "sys/load.pms",
                        },
                    },
                },
                {
                    opcode: "pushAllChanges",
                    blockType: Scratch.BlockType.COMMAND,
                    text: "push batch with message [MSG]",
                    arguments: {
                        MSG: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "Subsystem sync",
                        },
                    },
                },
                "---",
                {
                    opcode: "needsUpdateText",
                    blockType: Scratch.BlockType.BOOLEAN,
                    text: "does text [CONTENT] differ from [FILE]?",
                    arguments: {
                        CONTENT: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "{}",
                        },
                        FILE: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "sys/data.json",
                        },
                    },
                },
                {
                    opcode: "needsUpdateURL",
                    blockType: Scratch.BlockType.BOOLEAN,
                    text: "does data URL [CONTENT] differ from [FILE]?",
                    arguments: {
                        CONTENT: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "data:application/zip;base64,...",
                        },
                        FILE: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "sys/load.pms",
                        },
                    },
                },
                "---",
                {
                    opcode: "getGitChanges",
                    blockType: Scratch.BlockType.REPORTER,
                    text: "uncommitted changes",
                },
                {
                    opcode: "isServerOnline",
                    blockType: Scratch.BlockType.BOOLEAN,
                    text: "server online?",
                },
            ],
        };
    }

    // --- INTERNAL HELPER ---
    _stageFileHelper(file, content, dataType) {
        return fetch("http://127.0.0.1:5000/check_diff", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                path: file,
                content: content,
                type: dataType,
            }),
        })
            .then((res) => res.json())
            .then((diffData) => {
                if (diffData.changed) {
                    console.log(
                        `Changes detected in ${file}, writing to disk...`,
                    );
                    return fetch("http://127.0.0.1:5000/save_file", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            path: file,
                            content: content,
                            type: dataType,
                        }),
                    });
                } else {
                    console.log(`Skipped ${file}: Content is identical.`);
                }
            })
            .catch((err) => console.error("Connection error:", err));
    }

    _diffHelper(file, content, dataType) {
        return fetch("http://127.0.0.1:5000/check_diff", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                path: file,
                content: content,
                type: dataType,
            }),
        })
            .then((res) => res.json())
            .then((data) => data.changed === true)
            .catch(() => false);
    }

    // --- COMMANDS ---
    stageTextFile(args) {
        return this._stageFileHelper(args.FILE, args.CONTENT, "text");
    }
    stageURLFile(args) {
        return this._stageFileHelper(args.FILE, args.CONTENT, "data_url");
    }

    pushAllChanges(args) {
        return fetch("http://127.0.0.1:5000/commit_and_push", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: args.MSG }),
        })
            .then((res) => res.json())
            .then((data) => console.log(data.message || data.error))
            .catch((err) => console.error("Connection error:", err));
    }

    // --- REPORTERS ---
    needsUpdateText(args) {
        return this._diffHelper(args.FILE, args.CONTENT, "text");
    }
    needsUpdateURL(args) {
        return this._diffHelper(args.FILE, args.CONTENT, "data_url");
    }

    getGitChanges() {
        return fetch("http://127.0.0.1:5000/git_status")
            .then((res) => res.json())
            .then((data) => data.output || "Error reading git")
            .catch(() => "Server offline");
    }

    isServerOnline() {
        return fetch("http://127.0.0.1:5000/ping")
            .then((res) => res.json())
            .then((data) => data.status === "online")
            .catch(() => false);
    }
}

Scratch.extensions.register(new PORAdvancedSyncExtension());
