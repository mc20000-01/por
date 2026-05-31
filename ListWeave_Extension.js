class ListWeaveExtension {
    getInfo() {
        return {
            id: "listweave",
            name: "List Weave",
            color1: "#6a0dad",
            color2: "#520a99",
            blocks: [
                {
                    // [1,3] + [2,4] = [1,2,3,4]
                    // Alternates elements from A and B. If one runs out, appends the rest of the other.
                    opcode: "interleave",
                    blockType: Scratch.BlockType.REPORTER,
                    text: "interleave [A] and [B]",
                    arguments: {
                        A: { type: Scratch.ArgumentType.STRING, defaultValue: "[1,3]" },
                        B: { type: Scratch.ArgumentType.STRING, defaultValue: "[2,4]" },
                    },
                },
                {
                    // Interleave N lists at once: [[1,4],[2,5],[3,6]] = [1,2,3,4,5,6]
                    opcode: "interleaveMany",
                    blockType: Scratch.BlockType.REPORTER,
                    text: "interleave lists [LISTS]",
                    arguments: {
                        LISTS: { type: Scratch.ArgumentType.STRING, defaultValue: "[[1,4],[2,5],[3,6]]" },
                    },
                },
                "---",
                {
                    // Zip: pairs up elements → [[1,2],[3,4]]
                    opcode: "zip",
                    blockType: Scratch.BlockType.REPORTER,
                    text: "zip [A] with [B]",
                    arguments: {
                        A: { type: Scratch.ArgumentType.STRING, defaultValue: "[1,3]" },
                        B: { type: Scratch.ArgumentType.STRING, defaultValue: "[2,4]" },
                    },
                },
                {
                    // Unzip: [[1,2],[3,4]] → { a:[1,3], b:[2,4] }
                    opcode: "unzip",
                    blockType: Scratch.BlockType.REPORTER,
                    text: "unzip [PAIRS]",
                    arguments: {
                        PAIRS: { type: Scratch.ArgumentType.STRING, defaultValue: "[[1,2],[3,4]]" },
                    },
                },
                "---",
                {
                    // Flatten one level: [[1,2],[3,4]] → [1,2,3,4]
                    opcode: "flatten",
                    blockType: Scratch.BlockType.REPORTER,
                    text: "flatten [LIST]",
                    arguments: {
                        LIST: { type: Scratch.ArgumentType.STRING, defaultValue: "[[1,2],[3,4]]" },
                    },
                },
                {
                    // Chunk: [1,2,3,4] by size 2 → [[1,2],[3,4]]
                    opcode: "chunk",
                    blockType: Scratch.BlockType.REPORTER,
                    text: "chunk [LIST] by [SIZE]",
                    arguments: {
                        LIST: { type: Scratch.ArgumentType.STRING, defaultValue: "[1,2,3,4]" },
                        SIZE: { type: Scratch.ArgumentType.NUMBER, defaultValue: 2 },
                    },
                },
            ],
        };
    }

    // ── HELPERS ──────────────────────────────────────────────────────────

    _parse(str) {
        try {
            const v = JSON.parse(str);
            return Array.isArray(v) ? v : null;
        } catch {
            return null;
        }
    }

    _safe(val) {
        return JSON.stringify(val ?? []);
    }

    // ── BLOCKS ───────────────────────────────────────────────────────────

    interleave(args) {
        const a = this._parse(args.A);
        const b = this._parse(args.B);
        if (!a || !b) return "[]";

        const out = [];
        const len = Math.max(a.length, b.length);
        for (let i = 0; i < len; i++) {
            if (i < a.length) out.push(a[i]);
            if (i < b.length) out.push(b[i]);
        }
        return this._safe(out);
    }

    interleaveMany(args) {
        const lists = this._parse(args.LISTS);
        if (!lists || !lists.every(Array.isArray)) return "[]";

        const out = [];
        const len = Math.max(...lists.map(l => l.length));
        for (let i = 0; i < len; i++) {
            for (const list of lists) {
                if (i < list.length) out.push(list[i]);
            }
        }
        return this._safe(out);
    }

    zip(args) {
        const a = this._parse(args.A);
        const b = this._parse(args.B);
        if (!a || !b) return "[]";
        const len = Math.min(a.length, b.length);
        const out = [];
        for (let i = 0; i < len; i++) out.push([a[i], b[i]]);
        return this._safe(out);
    }

    unzip(args) {
        const pairs = this._parse(args.PAIRS);
        if (!pairs) return "{}";
        const a = [], b = [];
        for (const pair of pairs) {
            if (Array.isArray(pair)) {
                a.push(pair[0] ?? null);
                b.push(pair[1] ?? null);
            }
        }
        return JSON.stringify({ a, b });
    }

    flatten(args) {
        const list = this._parse(args.LIST);
        if (!list) return "[]";
        return this._safe(list.flat(1));
    }

    chunk(args) {
        const list = this._parse(args.LIST);
        const size = Math.max(1, Math.floor(Number(args.SIZE)));
        if (!list) return "[]";
        const out = [];
        for (let i = 0; i < list.length; i += size)
            out.push(list.slice(i, i + size));
        return this._safe(out);
    }
}

Scratch.extensions.register(new ListWeaveExtension());
