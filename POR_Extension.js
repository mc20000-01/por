class PORAdvancedSyncExtension {
    constructor() {
        this.cwd = "";
        this.exportMode = "dev"; // "dev" | "prod"
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
                        MODE: { type: Scratch.ArgumentType.STRING, menu: "exportModes" }
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
                        DIR: { type: Scratch.ArgumentType.STRING, defaultValue: "pacs/sys" }
                    },
                },
                {
                    opcode: "getCwd",
                    blockType: Scratch.BlockType.REPORTER,
                    text: "pwd",
                },
                {
                    opcode: "listDirectory",
                    blockType: Scratch.BlockType.REPORTER,
                    text: "ls",
                },

                "---",

                // ── SAVING ───────────────────────────────────────────────
                {
                    opcode: "stageTextFile",
                    blockType: Scratch.BlockType.COMMAND,
                    text: "stage text [CONTENT] to [FILE]",
                    arguments: {
                        CONTENT: { type: Scratch.ArgumentType.STRING, defaultValue: '{"status":"ok"}' },
                        FILE:    { type: Scratch.ArgumentType.STRING, defaultValue: "data.json" }
                    },
                },

                "---",

                // ── EXPORTING ────────────────────────────────────────────
                {
                    opcode: "exportProject",
                    blockType: Scratch.BlockType.COMMAND,
                    text: "export entire project to [FILE]",
                    arguments: {
                        FILE: { type: Scratch.ArgumentType.STRING, defaultValue: "build.pmp" }
                    },
                },
                {
                    // Standard dev export — keeps all POR studio blocks
                    opcode: "exportSprite",
                    blockType: Scratch.BlockType.COMMAND,
                    text: "export sprite [TARGET] to [FILE]",
                    arguments: {
                        TARGET: { type: Scratch.ArgumentType.STRING, menu: "targets" },
                        FILE:   { type: Scratch.ArgumentType.STRING, defaultValue: "entity.pms" }
                    },
                },
                {
                    // Prod export — strips all poradvsync_* blocks before saving.
                    // Call jgScripts "delete all scripts" BEFORE this so script
                    // bodies are cleared. jgScripts block shapes can stay in the
                    // sprite JSON as empty shells; they're harmless at runtime.
                    opcode: "exportSpriteProd",
                    blockType: Scratch.BlockType.COMMAND,
                    text: "export sprite [TARGET] to [FILE] (prod)",
                    arguments: {
                        TARGET: { type: Scratch.ArgumentType.STRING, menu: "targets" },
                        FILE:   { type: Scratch.ArgumentType.STRING, defaultValue: "entity.pms" }
                    },
                },
                {
                    opcode: "exportCostume",
                    blockType: Scratch.BlockType.COMMAND,
                    text: "export costume [COSTUME] of [TARGET] to [FILE]",
                    arguments: {
                        COSTUME: { type: Scratch.ArgumentType.STRING, defaultValue: "costume1" },
                        TARGET:  { type: Scratch.ArgumentType.STRING, menu: "targets" },
                        FILE:    { type: Scratch.ArgumentType.STRING, defaultValue: "texture.png" }
                    },
                },

                "---",

                // ── GIT ──────────────────────────────────────────────────
                {
                    opcode: "pushAllChanges",
                    blockType: Scratch.BlockType.COMMAND,
                    text: "git push with message [MSG]",
                    arguments: {
                        MSG: { type: Scratch.ArgumentType.STRING, defaultValue: "App export sync" }
                    },
                },
            ],

            menus: {
                targets:     { acceptReporters: true,  items: "_getTargets" },
                exportModes: { acceptReporters: false, items: ["dev", "prod"] },
            },
        };
    }

    // ── INTERNALS ────────────────────────────────────────────────────────

    _getPath(filename) {
        if (!this.cwd) return filename;
        return this.cwd.endsWith("/") ? this.cwd + filename : this.cwd + "/" + filename;
    }

    _blobToDataURI(blob) {
        return new Promise((resolve, reject) => {
            const fr = new FileReader();
            fr.onload  = () => resolve(fr.result);
            fr.onerror = () => reject(new Error(`FileReader error: ${fr.error}`));
            fr.readAsDataURL(blob);
        });
    }

    _getTargetFromMenu(name) {
        if (name === "_myself_") {
            const t = Scratch.vm.editingTarget;
            return t ? t.sprite.clones[0] : null;
        }
        return Scratch.vm.runtime.getSpriteTargetByName(name);
    }

    _getTargets() {
        const out = [];
        if (Scratch.vm.editingTarget && !Scratch.vm.editingTarget.isStage)
            out.push({ text: "myself", value: "_myself_" });
        const targets = Scratch.vm.runtime.targets;
        for (let i = 1; i < targets.length; i++)
            if (targets[i].isOriginal) out.push(targets[i].getName());
        return out.length ? out : [""];
    }

    _stageFileHelper(file, content, dataType) {
        const fullPath = this._getPath(file);
        return fetch("http://127.0.0.1:5000/check_diff", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: fullPath, content, type: dataType }),
        })
        .then(r => r.json())
        .then(diff => {
            if (diff.changed) {
                console.log(`[POR] writing ${fullPath}`);
                return fetch("http://127.0.0.1:5000/save_file", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ path: fullPath, content, type: dataType }),
                });
            } else {
                console.log(`[POR] no change: ${fullPath}`);
            }
        })
        .catch(e => console.error("[POR] connection error:", e));
    }

    // Strips every block whose opcode starts with "poradvsync_" from a
    // serialised sprite JSON string. Also cleans up orphaned parent refs.
    _stripPorBlocks(spriteJson) {
        try {
            const data   = JSON.parse(spriteJson);
            const blocks = data.blocks || {};

            // First pass: mark all poradvsync blocks
            const toRemove = new Set();
            for (const [id, block] of Object.entries(blocks)) {
                if (typeof block === "object" && block?.opcode?.startsWith("poradvsync_"))
                    toRemove.add(id);
            }

            // Second pass: propagate removal down child chains
            let changed = true;
            while (changed) {
                changed = false;
                for (const [id, block] of Object.entries(blocks)) {
                    if (toRemove.has(id) || typeof block !== "object") continue;
                    if (block.parent && toRemove.has(block.parent)) {
                        toRemove.add(id);
                        changed = true;
                    }
                }
            }

            for (const id of toRemove) delete blocks[id];
            data.blocks = blocks;

            console.log(`[POR] prod strip: removed ${toRemove.size} poradvsync blocks`);
            return JSON.stringify(data);
        } catch (e) {
            console.error("[POR] strip failed, exporting as-is:", e);
            return spriteJson;
        }
    }

    // ── EXPORT MODE ──────────────────────────────────────────────────────

    setExportMode(args) {
        this.exportMode = args.MODE === "prod" ? "prod" : "dev";
        console.log(`[POR] export mode → ${this.exportMode}`);
    }

    getExportMode() { return this.exportMode; }

    // ── DIRECTORY ────────────────────────────────────────────────────────

    setCwd(args) {
        const d = args.DIR.trim();
        this.cwd = (d === "/" || d === "\\" || d === "") ? "" : d;
    }

    getCwd() { return this.cwd ? "/" + this.cwd : "/"; }

    listDirectory() {
        return fetch("http://127.0.0.1:5000/list_dir", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: this.cwd }),
        })
        .then(r => r.json())
        .then(d => d.files ? JSON.stringify(d.files) : "[]")
        .catch(() => "[]");
    }

    // ── SAVING & EXPORTING ───────────────────────────────────────────────

    stageTextFile(args) {
        return this._stageFileHelper(args.FILE, args.CONTENT, "text");
    }

    exportProject(args) {
        return Scratch.vm.saveProjectSb3()
            .then(blob => this._blobToDataURI(blob))
            .then(uri  => this._stageFileHelper(args.FILE, uri, "data_url"))
            .catch(e   => console.error("[POR] project export failed:", e));
    }

    exportSprite(args) {
        const target = this._getTargetFromMenu(args.TARGET);
        if (!target) { console.error("[POR] target not found"); return; }
        return Scratch.vm.exportSprite(target.id)
            .then(blob => this._blobToDataURI(blob))
            .then(uri  => this._stageFileHelper(args.FILE, uri, "data_url"))
            .catch(e   => console.error("[POR] sprite export failed:", e));
    }

    exportSpriteProd(args) {
        // Recommended usage in Scratch before calling this block:
        //   [jgScripts] delete all scripts   ← clears script body refs
        //   [poradvsync] export sprite (prod) ← strips poradvsync blocks
        const target = this._getTargetFromMenu(args.TARGET);
        if (!target) { console.error("[POR] target not found"); return; }
        return Scratch.vm.exportSprite(target.id)
            .then(blob  => blob.text())
            .then(json  => this._stripPorBlocks(json))
            .then(clean => {
                const blob = new Blob([clean], { type: "application/json" });
                return this._blobToDataURI(blob);
            })
            .then(uri => this._stageFileHelper(args.FILE, uri, "data_url"))
            .catch(e  => console.error("[POR] prod export failed:", e));
    }

    exportCostume(args) {
        const target = this._getTargetFromMenu(args.TARGET);
        if (!target) return;
        const idx = target.getCostumeIndexByName(args.COSTUME);
        if (idx < 0) { console.error("[POR] costume not found"); return; }
        const dataUri = target.sprite.costumes[idx].asset.encodeDataURI();
        return this._stageFileHelper(args.FILE, dataUri, "data_url");
    }

    // ── GIT ──────────────────────────────────────────────────────────────

    pushAllChanges(args) {
        return fetch("http://127.0.0.1:5000/commit_and_push", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: args.MSG }),
        })
        .then(r => r.json())
        .then(d => console.log("[POR]", d.message || d.error))
        .catch(e => console.error("[POR] push error:", e));
    }
}

Scratch.extensions.register(new PORAdvancedSyncExtension());
