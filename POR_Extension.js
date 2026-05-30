class PORAdvancedSyncExtension {
    constructor() {
        this.cwd = "";
        this.exportMode = "dev"; // "dev" | "prod"
        this._namedScripts = {}; // name -> { blocks: [...blockIds], spriteId }
    }

    getInfo() {
        return {
            id: "poradvsync",
            name: "POR Smart Studio",
            color1: "#0366d6",
            color2: "#005cc5",
            blocks: [

                // ── EXPORT MODE ──────────────────────────────────────────
                {
                    opcode: "setExportMode",
                    blockType: Scratch.BlockType.COMMAND,
                    text: "set export mode to [MODE]",
                    arguments: {
                        MODE: {
                            type: Scratch.ArgumentType.STRING,
                            menu: "exportModes",
                        },
                    },
                },
                {
                    opcode: "getExportMode",
                    blockType: Scratch.BlockType.REPORTER,
                    text: "export mode",
                },

                "---",

                // ── DIRECTORY MANAGEMENT ─────────────────────────────────
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

                // ── STANDARD SAVING ──────────────────────────────────────
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

                // ── EXPORTING ────────────────────────────────────────────
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
                            defaultValue: "entity.pms",
                        },
                    },
                },
                {
                    // Prod export: strips all poradvsync + dev-tagged blocks before export
                    opcode: "exportSpriteProd",
                    blockType: Scratch.BlockType.COMMAND,
                    text: "export sprite [TARGET] to [FILE] (prod — strip dev blocks)",
                    arguments: {
                        TARGET: {
                            type: Scratch.ArgumentType.STRING,
                            menu: "targets",
                        },
                        FILE: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "entity.pms",
                        },
                    },
                },
                {
                    opcode: "exportCostume",
                    blockType: Scratch.BlockType.COMMAND,
                    text: "export costume [COSTUME] of sprite [TARGET] to [FILE]",
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

                // ── NAMED SCRIPTS (dev/prod code separation) ─────────────
                // Create a named group of blocks you can run or strip at export time.
                // Tag scripts as "dev" to have exportSpriteProd remove them.
                {
                    opcode: "createScript",
                    blockType: Scratch.BlockType.COMMAND,
                    text: "create script named [NAME] tagged [TAG]",
                    arguments: {
                        NAME: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "Script1",
                        },
                        TAG: {
                            type: Scratch.ArgumentType.STRING,
                            menu: "scriptTags",
                        },
                    },
                },
                {
                    opcode: "deleteScript",
                    blockType: Scratch.BlockType.COMMAND,
                    text: "delete script named [NAME]",
                    arguments: {
                        NAME: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "Script1",
                        },
                    },
                },
                {
                    opcode: "deleteAllScripts",
                    blockType: Scratch.BlockType.COMMAND,
                    text: "delete all scripts",
                },
                {
                    opcode: "deleteScriptsByTag",
                    blockType: Scratch.BlockType.COMMAND,
                    text: "delete all scripts tagged [TAG]",
                    arguments: {
                        TAG: {
                            type: Scratch.ArgumentType.STRING,
                            menu: "scriptTags",
                        },
                    },
                },
                {
                    opcode: "scriptExists",
                    blockType: Scratch.BlockType.BOOLEAN,
                    text: "script named [NAME] exists?",
                    arguments: {
                        NAME: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "Script1",
                        },
                    },
                },
                {
                    opcode: "listScripts",
                    blockType: Scratch.BlockType.REPORTER,
                    text: "all scripts",
                },
                {
                    opcode: "scriptData",
                    blockType: Scratch.BlockType.REPORTER,
                    text: "script data for [NAME]",
                    arguments: {
                        NAME: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "Script1",
                        },
                    },
                },
                {
                    opcode: "runScript",
                    blockType: Scratch.BlockType.COMMAND,
                    text: "run script [NAME] in [TARGET]",
                    arguments: {
                        NAME: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "Script1",
                        },
                        TARGET: {
                            type: Scratch.ArgumentType.STRING,
                            menu: "targets",
                        },
                    },
                },
                {
                    opcode: "runScriptWithData",
                    blockType: Scratch.BlockType.COMMAND,
                    text: "run script [NAME] in [TARGET] with data [DATA]",
                    arguments: {
                        NAME: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "Script1",
                        },
                        TARGET: {
                            type: Scratch.ArgumentType.STRING,
                            menu: "targets",
                        },
                        DATA: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "data",
                        },
                    },
                },

                "---",

                // ── GIT ──────────────────────────────────────────────────
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
                exportModes: {
                    acceptReporters: false,
                    items: ["dev", "prod"],
                },
                scriptTags: {
                    acceptReporters: true,
                    items: ["dev", "prod", "sys", "usr", "any"],
                },
            },
        };
    }

    // ── INTERNAL UTILITIES ───────────────────────────────────────────────

    _getPath(filename) {
        if (this.cwd === "") return filename;
        if (this.cwd.endsWith("/")) return this.cwd + filename;
        return this.cwd + "/" + filename;
    }

    _blobToDataURI(blob) {
        return new Promise((resolve, reject) => {
            const fr = new FileReader();
            fr.onload = () => resolve(fr.result);
            fr.onerror = () => reject(new Error(`FileReader error: ${fr.error}`));
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
            body: JSON.stringify({ path: fullPath, content, type: dataType }),
        })
            .then((res) => res.json())
            .then((diffData) => {
                if (diffData.changed) {
                    console.log(`[POR] Writing to disk: ${fullPath}`);
                    return fetch("http://127.0.0.1:5000/save_file", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ path: fullPath, content, type: dataType }),
                    });
                } else {
                    console.log(`[POR] No change: ${fullPath}`);
                }
            })
            .catch((err) => console.error("[POR] Connection error:", err));
    }

    // Strips all blocks belonging to poradvsync extension AND any dev-tagged
    // named scripts from a serialized sprite JSON, returning cleaned JSON.
    _stripDevBlocks(spriteJson) {
        try {
            const data = JSON.parse(spriteJson);
            const blocks = data.blocks || {};

            // Collect block IDs to remove:
            // 1. Any block whose opcode starts with "poradvsync_"
            // 2. Any block in a dev-tagged named script
            const devScriptBlockIds = new Set();
            for (const [name, meta] of Object.entries(this._namedScripts)) {
                if (meta.tag === "dev") {
                    (meta.blockIds || []).forEach((id) => devScriptBlockIds.add(id));
                }
            }

            const toRemove = new Set();
            for (const [id, block] of Object.entries(blocks)) {
                if (!block || typeof block !== "object") continue;
                if (
                    block.opcode?.startsWith("poradvsync_") ||
                    devScriptBlockIds.has(id)
                ) {
                    toRemove.add(id);
                }
            }

            // Walk up parent chains so we don't leave dangling references
            // (simple pass: also remove any block whose parent is being removed)
            let changed = true;
            while (changed) {
                changed = false;
                for (const [id, block] of Object.entries(blocks)) {
                    if (toRemove.has(id)) continue;
                    if (!block || typeof block !== "object") continue;
                    if (block.parent && toRemove.has(block.parent)) {
                        toRemove.add(id);
                        changed = true;
                    }
                }
            }

            for (const id of toRemove) {
                delete blocks[id];
            }

            data.blocks = blocks;
            console.log(`[POR] Prod strip: removed ${toRemove.size} dev blocks`);
            return JSON.stringify(data);
        } catch (e) {
            console.error("[POR] Strip failed, exporting as-is:", e);
            return spriteJson;
        }
    }

    // ── EXPORT MODE ──────────────────────────────────────────────────────

    setExportMode(args) {
        this.exportMode = args.MODE === "prod" ? "prod" : "dev";
        console.log(`[POR] Export mode: ${this.exportMode}`);
    }

    getExportMode() {
        return this.exportMode;
    }

    // ── DIRECTORY COMMANDS ───────────────────────────────────────────────

    setCwd(args) {
        let newDir = args.DIR.trim();
        this.cwd = (newDir === "/" || newDir === "\\" || newDir === "") ? "" : newDir;
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
            .then((data) => (data.files ? JSON.stringify(data.files) : "[]"))
            .catch(() => "[]");
    }

    // ── SAVING AND EXPORTING ─────────────────────────────────────────────

    stageTextFile(args) {
        return this._stageFileHelper(args.FILE, args.CONTENT, "text");
    }

    exportProject(args) {
        return Scratch.vm.saveProjectSb3()
            .then((blob) => this._blobToDataURI(blob))
            .then((dataUri) => this._stageFileHelper(args.FILE, dataUri, "data_url"))
            .catch((err) => console.error("[POR] Project export failed:", err));
    }

    exportSprite(args) {
        const target = this._getTargetFromMenu(args.TARGET);
        if (!target) { console.error("[POR] Target not found!"); return; }
        return Scratch.vm.exportSprite(target.id)
            .then((blob) => this._blobToDataURI(blob))
            .then((dataUri) => this._stageFileHelper(args.FILE, dataUri, "data_url"))
            .catch((err) => console.error("[POR] Sprite export failed:", err));
    }

    exportSpriteProd(args) {
        const target = this._getTargetFromMenu(args.TARGET);
        if (!target) { console.error("[POR] Target not found!"); return; }

        // Serialize the sprite, strip dev blocks, re-encode and save
        return Scratch.vm.exportSprite(target.id)
            .then((blob) => blob.text())
            .then((jsonText) => {
                const cleaned = this._stripDevBlocks(jsonText);
                const cleanedBlob = new Blob([cleaned], { type: "application/json" });
                return this._blobToDataURI(cleanedBlob);
            })
            .then((dataUri) => this._stageFileHelper(args.FILE, dataUri, "data_url"))
            .catch((err) => console.error("[POR] Prod sprite export failed:", err));
    }

    exportCostume(args) {
        const target = this._getTargetFromMenu(args.TARGET);
        if (!target) return;
        const costumeIndex = target.getCostumeIndexByName(args.COSTUME);
        if (costumeIndex < 0) { console.error("[POR] Costume not found!"); return; }
        const costume = target.sprite.costumes[costumeIndex];
        const dataUri = costume.asset.encodeDataURI();
        return this._stageFileHelper(args.FILE, dataUri, "data_url");
    }

    // ── NAMED SCRIPTS ────────────────────────────────────────────────────
    // These track logical groups of block IDs so you can:
    //   - run them via broadcast at runtime
    //   - strip dev-tagged ones in exportSpriteProd

    createScript(args) {
        const name = args.NAME;
        const tag = args.TAG || "any";
        if (!this._namedScripts[name]) {
            this._namedScripts[name] = { tag, blockIds: [], data: null };
            console.log(`[POR] Created script '${name}' [${tag}]`);
        }
    }

    deleteScript(args) {
        delete this._namedScripts[args.NAME];
    }

    deleteAllScripts() {
        this._namedScripts = {};
    }

    deleteScriptsByTag(args) {
        for (const name of Object.keys(this._namedScripts)) {
            if (this._namedScripts[name].tag === args.TAG) {
                delete this._namedScripts[name];
            }
        }
    }

    scriptExists(args) {
        return args.NAME in this._namedScripts;
    }

    listScripts() {
        return JSON.stringify(
            Object.entries(this._namedScripts).map(([name, meta]) => ({
                name,
                tag: meta.tag,
            }))
        );
    }

    scriptData(args) {
        const script = this._namedScripts[args.NAME];
        if (!script) return "";
        return script.data !== null ? String(script.data) : "";
    }

    runScript(args) {
        // Fires a broadcast named after the script so Scratch blocks handle it
        const name = args.NAME;
        if (!(name in this._namedScripts)) {
            console.warn(`[POR] runScript: no script '${name}'`);
            return;
        }
        Scratch.vm.runtime.startHats("event_whenbroadcastreceived", {
            BROADCAST_OPTION: name,
        });
    }

    runScriptWithData(args) {
        const name = args.NAME;
        if (!(name in this._namedScripts)) {
            console.warn(`[POR] runScriptWithData: no script '${name}'`);
            return;
        }
        // Store data so scriptData reporter can read it inside the hat
        this._namedScripts[name].data = args.DATA;
        Scratch.vm.runtime.startHats("event_whenbroadcastreceived", {
            BROADCAST_OPTION: name,
        });
    }

    // ── GIT ──────────────────────────────────────────────────────────────

    pushAllChanges(args) {
        return fetch("http://127.0.0.1:5000/commit_and_push", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: args.MSG }),
        })
            .then((res) => res.json())
            .then((data) => console.log("[POR]", data.message || data.error))
            .catch((err) => console.error("[POR] Push error:", err));
    }
}

Scratch.extensions.register(new PORAdvancedSyncExtension());