class PORBatchSyncExtension {
    getInfo() {
        return {
            id: "porbatchsync",
            name: "POR Subsystem Batch Sync",
            color1: "#24292e",
            color2: "#1b1f23",
            blocks: [
                {
                    opcode: "stageFile",
                    blockType: Scratch.BlockType.COMMAND,
                    text: "stage file [FILE] with data [CONTENT]",
                    arguments: {
                        FILE: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "subsystem_one/config.json",
                        },
                        CONTENT: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: '{"status": "active"}',
                        },
                    },
                },
                {
                    opcode: "pushAllChanges",
                    blockType: Scratch.BlockType.COMMAND,
                    text: "push all staged files with message [MSG]",
                    arguments: {
                        MSG: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "Batch update of multiple subsystems",
                        },
                    },
                },
            ],
        };
    }

    stageFile(args) {
        return fetch("http://127.0.0.1:5000/save_file", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                path: args.FILE,
                content: args.CONTENT,
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.status === "success") {
                    console.log(data.message);
                } else {
                    console.error("Local save failed:", data.error);
                }
            })
            .catch((error) => {
                console.error(
                    "Could not connect to server. Is server.py running?",
                    error,
                );
            });
    }

    pushAllChanges(args) {
        return fetch("http://127.0.0.1:5000/commit_and_push", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: args.MSG,
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.status === "success") {
                    console.log(data.message);
                } else {
                    console.error("GitHub push failed:", data.error);
                }
            })
            .catch((error) => {
                console.error(
                    "Could not connect to server. Is server.py running?",
                    error,
                );
            });
    }
}

Scratch.extensions.register(new PORBatchSyncExtension());
