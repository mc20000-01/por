class PORAdvancedSyncExtension {
    getInfo() {
        return {
            id: "porsync",
            name: "POR Smart Sync",
            color1: "#0366d6", // GitHub Blue
            color2: "#005cc5",
            blocks: [
                {
                    opcode: "smartStageFile",
                    blockType: Scratch.BlockType.COMMAND,
                    text: "smart stage [FILE] with data [CONTENT]",
                    arguments: {
                        FILE: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "sys/data.json",
                        },
                        CONTENT: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "{}",
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
                "---", // Adds a nice divider line in the block menu
                {
                    opcode: "needsUpdate",
                    blockType: Scratch.BlockType.BOOLEAN, // Hexagonal block
                    text: "does [FILE] differ from [CONTENT]?",
                    arguments: {
                        FILE: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "sys/data.json",
                        },
                        CONTENT: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "{}",
                        },
                    },
                },
                {
                    opcode: "getGitChanges",
                    blockType: Scratch.BlockType.REPORTER, // Rounded block
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

    // --- COMMANDS ---

    smartStageFile(args) {
        // First, check if the file actually needs to be updated
        return fetch("http://127.0.0.1:5000/check_diff", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: args.FILE, content: args.CONTENT }),
        })
            .then((res) => res.json())
            .then((diffData) => {
                if (diffData.changed) {
                    // Only save if the diff is true
                    console.log(
                        `Changes detected in ${args.FILE}, writing to disk...`,
                    );
                    return fetch("http://127.0.0.1:5000/save_file", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            path: args.FILE,
                            content: args.CONTENT,
                        }),
                    });
                } else {
                    console.log(`Skipped ${args.FILE}: Content is identical.`);
                }
            })
            .catch((err) => console.error("Connection error:", err));
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

    needsUpdate(args) {
        return fetch("http://127.0.0.1:5000/check_diff", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: args.FILE, content: args.CONTENT }),
        })
            .then((res) => res.json())
            .then((data) => {
                return data.changed === true;
            })
            .catch(() => {
                return false; // Fail safe
            });
    }

    getGitChanges() {
        return fetch("http://127.0.0.1:5000/git_status")
            .then((res) => res.json())
            .then((data) => {
                return data.output || "Error reading git";
            })
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
