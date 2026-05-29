class PORAdvancedSyncExtension {
    constructor() {
        // Treat this like your terminal's path. Starts at root (/home/sandisk/POR)
        this.cwd = "";
    }

    getInfo() {
        return {
            id: "poradvsync",
            name: "POR Smart Studio",
            color1: "#0366d6",
            color2: "#005cc5",
            blocks: [
                // --- DIRECTORY MANAGEMENT (Terminal-like) ---
                {
                    opcode: "setCwd",
                    blockType: Scratch.BlockType.COMMAND,
                    text: "cd into directory [DIR]",
                    arguments: {
                        DIR: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "apps/subsystem_1",
                        },
                    },
                },
                {
                    opcode: "getCwd",
                    blockType: Scratch.BlockType.REPORTER,
                    text: "pwd (current working dir)",
                },
                {
                    opcode: "listDirectory",
                    blockType: Scratch.BlockType.REPORTER,
                    text: "ls (files in current dir)",
                },
                "---",
                // --- STANDARD SAVING ---
                {
                    opcode: "stageTextFile",
                    blockType: Scratch.BlockType.COMMAND,
                    text: "stage text [CONTENT] to [FILE]",
                    arguments: {
                        CONTENT: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: '{"status": "ok"}',
                        },
                        FILE: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "data.json",
                        },
                    },
                },
                "---",
                // --- VM EXPORTING MAGIC ---
                {
                    opcode: "exportProject",
                    blockType: Scratch.BlockType.COMMAND,
                    text: "export entire project to [FILE]",
                    arguments: {
                        FILE: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "build.pms",
                        },
                    },
                },
                {
                    opcode: "exportSprite",
                    blockType: Scratch.BlockType.COMMAND,
                    text: "export sprite [TARGET] to [FILE]",
                    arguments: {
                        TARGET: {
                            type: Scratch.ArgumentType.STRING,
                            menu: "targets",
                        },
                        FILE: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "entity.sprite3",
                        },
                    },
                },
                {
                    opcode: "exportCostume",
                    blockType: Scratch.BlockType.COMMAND,
                    text:
                        "export costume [COSTUME] of sprite [TARGET] to [FILE]",
                    arguments: {
                        COSTUME: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "costume1",
                        },
                        TARGET: {
                            type: Scratch.ArgumentType.STRING,
                            menu: "targets",
                        },
                        FILE: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "texture.png",
                        },
                    },
                },
                "---",
                {
                    opcode: "pushAllChanges",
                    blockType: Scratch.BlockType.COMMAND,
                    text: "git push batch with message [MSG]",
                    arguments: {
                        MSG: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "App export sync",
                        },
                    },
                },
            ],
            menus: {
                targets: { acceptReporters: true, items: "_getTargets" },
            },
        };
    }

    // --- INTERNAL UTILITIES ---

    // Appends the current working directory to the file name
    _getPath(filename) {
        if (this.cwd === "") return filename;
        if (this.cwd.endsWith("/")) return this.cwd + filename;
        return this.cwd + "/" + filename;
    }

    _blobToDataURI(blob) {
        return new Promise((resolve, reject) => {
            const fr = new FileReader();
            fr.onload = () => resolve(fr.result);
            fr.onerror = () =>
                reject(new Error(`FileReader error: ${fr.error}`));
            fr.readAsDataURL(blob);
        });
    }

    _getTargetFromMenu(targetName) {
        if (targetName === "_myself_") {
            const editingTarget = Scratch.vm.editingTarget;
            return editingTarget ? editingTarget.sprite.clones[0] : null;
        }
        return Scratch.vm.runtime.getSpriteTargetByName(targetName);
    }

    _getTargets() {
        const spriteNames = [];
        if (Scratch.vm.editingTarget && !Scratch.vm.editingTarget.isStage) {
            spriteNames.push({ text: "myself", value: "_myself_" });
        }
        const targets = Scratch.vm.runtime.targets;
        for (let i = 1; i < targets.length; i++) {
            if (targets[i].isOriginal) spriteNames.push(targets[i].getName());
        }
        return spriteNames.length > 0 ? spriteNames : [""];
    }

    _stageFileHelper(file, content, dataType) {
        const fullPath = this._getPath(file);
        return fetch("http://127.0.0.1:5000/check_diff", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                path: fullPath,
                content: content,
                type: dataType,
            }),
        })
            .then((res) => res.json())
            .then((diffData) => {
                if (diffData.changed) {
                    console.log(`Writing to disk: ${fullPath}`);
                    return fetch("http://127.0.0.1:5000/save_file", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            path: fullPath,
                            content: content,
                            type: dataType,
                        }),
                    });
                }
            })
            .catch((err) => console.error("Connection error:", err));
    }

    // --- DIRECTORY COMMANDS ---

    setCwd(args) {
        // Cleans up the path slightly
        let newDir = args.DIR.trim();
        if (newDir === "/" || newDir === "\\" || newDir === "") {
            this.cwd = "";
        } else {
            this.cwd = newDir;
        }
    }

    getCwd() {
        return this.cwd === "" ? "/" : "/" + this.cwd;
    }

    listDirectory() {
        return fetch("http://127.0.0.1:5000/list_dir", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: this.cwd }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.files) return JSON.stringify(data.files);
                return "[]";
            })
            .catch(() => "[]");
    }

    // --- SAVING AND EXPORTING COMMANDS ---

    stageTextFile(args) {
        return this._stageFileHelper(args.FILE, args.CONTENT, "text");
    }

    exportProject(args) {
        return Scratch.vm.saveProjectSb3()
            .then((blob) => this._blobToDataURI(blob))
            .then((dataUri) =>
                this._stageFileHelper(args.FILE, dataUri, "data_url")
            )
            .catch((err) => console.error("Project export failed:", err));
    }

    exportSprite(args) {
        const target = this._getTargetFromMenu(args.TARGET);
        if (!target) {
            console.error("Target not found!");
            return;
        }
        return Scratch.vm.exportSprite(target.id)
            .then((blob) => this._blobToDataURI(blob))
            .then((dataUri) =>
                this._stageFileHelper(args.FILE, dataUri, "data_url")
            )
            .catch((err) => console.error("Sprite export failed:", err));
    }

    exportCostume(args) {
        const target = this._getTargetFromMenu(args.TARGET);
        if (!target) return;

        const costumeIndex = target.getCostumeIndexByName(args.COSTUME);
        if (costumeIndex < 0) {
            console.error("Costume not found!");
            return;
        }

        // Scratch costumes already have an internal Data URI encoder!
        const costume = target.sprite.costumes[costumeIndex];
        const dataUri = costume.asset.encodeDataURI();
        return this._stageFileHelper(args.FILE, dataUri, "data_url");
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
}

Scratch.extensions.register(new PORAdvancedSyncExtension());

