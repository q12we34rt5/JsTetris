function getCanvasElement(element) {
    if (typeof (element) == "string") {
        var canvas = null;
        canvas = document.getElementById(element);
        if (canvas == null)
            throw "Element id error: Can not found <canvas id=\"" + element + "\">.";
        else if (canvas.nodeName != "CANVAS")
            throw "Element type error: Id \"" + element + "\" is an " + canvas.nodeName + ", not an canvas.";
        return canvas;
    }
    try {
        if (element.nodeName != "CANVAS")
            throw "Element type error: Input element is an " + element.nodeName + ", not an canvas.";
        else
            return element;
    }
    catch (e) {
        throw "Element type error: The input element is not an Id or an HTML object.";
    }
}

function GetTexture(path) {
    var texture = {
        canvas: document.createElement("canvas"),
        width: 0,
        height: 0,
        ready: false
    };
    var img = new Image();
    img.onload = () => {
        texture.canvas.width = img.width;
        texture.canvas.height = img.height;
        texture.width = img.width / 16;
        texture.height = img.height / 10;
        texture.canvas.getContext("2d").drawImage(img, 0, 0);
        texture.ready = true;
    };
    img.src = path;
    return texture;
}

function CreateView(canvases = {
    board: null,
    next: [null, null, null, null, null],
    hold: null
}, kwargs = {
    block: {
        texture: {
            block: null,
            shadow: null
        },
        width: 16,
        height: 16
    },
    board: {
        sx: 3,
        sy: 3,
        width: 12,
        height: 22
    },
    next: {
        sx: 0,
        sy: 0,
        width: 6,
        height: 6
    },
    hold: {
        sx: 0,
        sy: 0,
        width: 6,
        height: 6
    }
}) {
    var view = {
        block: {
            texture: GetTexture(kwargs.block.texture.block),
            width: kwargs.block.width,
            height: kwargs.block.height
        },
        shadow: {
            texture: GetTexture(kwargs.block.texture.shadow),
            width: kwargs.block.width,
            height: kwargs.block.height
        },
        drawBlock: null,
        board: {
            canvas: canvases.board,
            ctx: canvases.board.getContext("2d"),
            data_buf: Array(kwargs.board.height).fill().map(() => new Uint8Array(kwargs.board.width).map(() => 0xFF)),
            shadow_buf: Array(kwargs.board.height).fill().map(() => new Uint8Array(kwargs.board.width).map(() => 0xFF)),
            sx: kwargs.board.sx,
            sy: kwargs.board.sy,
            width: kwargs.board.width,
            height: kwargs.board.height,
            pasteShadow: null,
            drawedBoundary: false,
            initial: null,
            update: null
        },
        boundaryData: [
            [0x16, 0x1A, 0x1A, 0x1A, 0x1A, 0x1C],
            [0x15, 0x00, 0x00, 0x00, 0x00, 0x15],
            [0x15, 0x00, 0x00, 0x00, 0x00, 0x15],
            [0x15, 0x00, 0x00, 0x00, 0x00, 0x15],
            [0x15, 0x00, 0x00, 0x00, 0x00, 0x15],
            [0x13, 0x1A, 0x1A, 0x1A, 0x1A, 0x19],
        ],
        next: {
            canvases: Array(5).fill().map(() => {
                return {
                    canvas: null,
                    ctx: null,
                    type: -1
                };
            }),
            sx: kwargs.next.sx,
            sy: kwargs.next.sy,
            width: kwargs.next.width,
            height: kwargs.next.height,
            boundarySrc: document.createElement("canvas"),
            drawedBoundary: false,
            initial: null,
            update: null
        },
        hold: {
            canvas: null,
            ctx: null,
            type: -1,
            sx: kwargs.hold.sx,
            sy: kwargs.hold.sy,
            width: kwargs.hold.width,
            height: kwargs.hold.height,
            boundarySrc: document.createElement("canvas"),
            drawedBoundary: false,
            initial: null,
            update: null
        }
    };
    // initial view
    view.drawBlock = (ctx, x, y, value) => {
        ctx.drawImage(view.block.texture.canvas, 0, 0,
            view.block.texture.width, view.block.texture.height,
            x * view.block.width, y * view.block.height,
            view.block.width, view.block.height);
        ctx.drawImage(view.block.texture.canvas,
            view.block.texture.width * (value & 0x0F),
            view.block.texture.height * (value >> 4),
            view.block.texture.width, view.block.texture.height,
            x * view.block.width, y * view.block.height,
            view.block.width, view.block.height);
    };
    // initial board
    view.board.pasteShadow = (x, y, value) => {
        view.board.ctx.drawImage(view.shadow.texture.canvas,
            view.shadow.texture.width * (value & 0x0F),
            view.shadow.texture.height * (value >> 4),
            view.shadow.texture.width, view.shadow.texture.height,
            x * view.shadow.width, y * view.shadow.height,
            view.shadow.width, view.shadow.height);
    };
    view.board.initial = () => {
        // set board canvas size
        canvases.board.width = view.board.width * view.block.width;
        canvases.board.height = view.board.height * view.block.height;
    };
    view.board.update = (data, shadow) => {
        if (!view.board.drawedBoundary && view.block.texture.ready) {
            for (var i = 0; i < view.board.height; i++)
                for (var j = 0; j < view.board.width; j++) {
                    view.drawBlock(view.board.ctx, j, i, view.board.data_buf[i][j]);
                    view.board.pasteShadow(j, i, view.board.shadow_buf[i][j]);
                }
            view.board.drawedBoundary = true;
        }
        if (view.block.texture.ready)
            for (var i = 0; i < view.board.height; i++)
                for (var j = 0; j < view.board.width; j++) {
                    const ci = view.board.sy + i, cj = view.board.sx + j;
                    if (view.board.data_buf[i][j] != data[ci][cj]) {
                        view.board.data_buf[i][j] = data[ci][cj];
                        view.drawBlock(view.board.ctx, j, i, view.board.data_buf[i][j]);
                    }
                    if (view.board.shadow_buf[i][j] != shadow[ci][cj] && !data[ci][cj]) {
                        view.board.shadow_buf[i][j] = shadow[ci][cj];
                        view.drawBlock(view.board.ctx, j, i, view.board.data_buf[i][j]);
                        view.board.pasteShadow(j, i, view.board.shadow_buf[i][j]);
                    }
                }
    };
    // initial next
    view.next.initial = () => {
        // set next canvases size
        try {
            view.next.canvases.forEach(value => {
                value.canvas.width = view.next.width * view.block.width;
                value.canvas.height = view.next.height * view.block.height;
            });
            view.next.boundarySrc.width = view.next.width * view.block.width;
            view.next.boundarySrc.height = view.next.height * view.block.height;
        } catch (e) { }
    };
    view.next.update = (queue) => {
        if (!view.next.drawedBoundary && view.block.texture.ready) {
            var ctx = view.next.boundarySrc.getContext("2d");
            for (var i = 0; i < view.next.height; i++)
                for (var j = 0; j < view.next.width; j++) {
                    const ci = view.next.sy + i, cj = view.next.sx + j;
                    view.drawBlock(ctx, j, i, view.boundaryData[ci][cj]);
                }
            view.next.drawedBoundary = true;
        }
        if (view.block.texture.ready)
            for (var k = 0; k < 5; k++) {
                if (view.next.canvases[k].type != queue[k].type) {
                    view.next.canvases[k].type = queue[k].type;
                    view.next.canvases[k].ctx.drawImage(view.next.boundarySrc, 0, 0);
                    for (var i = 0; i < queue[k].height; i++)
                        for (var j = 0; j < queue[k].width; j++)
                            if (queue[k].data[i][j])
                                view.drawBlock(view.next.canvases[k].ctx,
                                    j + 1 - view.next.sx + queue[k].offset_x,
                                    i + 2 - view.next.sy + queue[k].offset_y,
                                    queue[k].data[i][j]);
                }
            }
    };
    for (var i = 0; i < 5; i++) {
        try {
            view.next.canvases[i].canvas = canvases.next[i];
            view.next.canvases[i].ctx = canvases.next[i].getContext("2d");
        }
        catch (e) { }
    }
    // initial hold
    view.hold.canvas = canvases.hold;
    try { view.hold.ctx = canvases.hold.getContext("2d") }
    catch (e) { }
    view.hold.initial = () => {
        try {
            view.hold.canvas.width = view.hold.width * view.block.width;
            view.hold.canvas.height = view.hold.height * view.block.height;
        } catch (e) { }
        view.hold.boundarySrc.width = view.hold.width * view.block.width;
        view.hold.boundarySrc.height = view.hold.height * view.block.height;
    };
    view.hold.update = (block) => {
        if (!view.hold.drawedBoundary && view.block.texture.ready) {
            var ctx = view.hold.boundarySrc.getContext("2d");
            for (var i = 0; i < view.hold.height; i++)
                for (var j = 0; j < view.hold.width; j++) {
                    const ci = view.hold.sy + i, cj = view.hold.sx + j;
                    view.drawBlock(ctx, j, i, view.boundaryData[ci][cj]);
                }
            view.hold.ctx.drawImage(view.hold.boundarySrc, 0, 0);
            view.hold.drawedBoundary = true;
        }
        if (view.block.texture.ready) {
            if (view.hold.type != block.type) {
                view.hold.type = block.type;
                view.hold.ctx.drawImage(view.hold.boundarySrc, 0, 0);
                for (var i = 0; i < block.height; i++)
                    for (var j = 0; j < block.width; j++)
                        if (block.data[i][j])
                            view.drawBlock(view.hold.ctx,
                                j + 1 - view.hold.sx + block.offset_x,
                                i + 2 - view.hold.sy + block.offset_y,
                                block.data[i][j]);
            }
        }
    };
    // initial 
    view.board.initial();
    view.next.initial();
    view.hold.initial();
    return view;
}

function CreateModel(width, height) {
    const sx = 6, sy = 6;
    var model = {
        block: {
            type: {
                Z: 0,
                L: 1,
                O: 2,
                S: 3,
                I: 4,
                J: 5,
                T: 6
            },
            size: [
                { width: 3, height: 3 },
                { width: 3, height: 3 },
                { width: 4, height: 3 },
                { width: 3, height: 3 },
                { width: 4, height: 4 },
                { width: 3, height: 3 },
                { width: 3, height: 3 }
            ],
            data: [
                [
                    [
                        [0x32, 0x3C, 0x00],
                        [0x00, 0x33, 0x38],
                        [0x00, 0x00, 0x00]
                    ],
                    [
                        [0x00, 0x00, 0x34],
                        [0x00, 0x36, 0x39],
                        [0x00, 0x31, 0x00]
                    ],
                    [
                        [0x00, 0x00, 0x00],
                        [0x32, 0x3C, 0x00],
                        [0x00, 0x33, 0x38]
                    ],
                    [
                        [0x00, 0x34, 0x00],
                        [0x36, 0x39, 0x00],
                        [0x31, 0x00, 0x00]
                    ]
                ],
                [
                    [
                        [0x00, 0x00, 0x44],
                        [0x42, 0x4A, 0x49],
                        [0x00, 0x00, 0x00]
                    ],
                    [
                        [0x00, 0x44, 0x00],
                        [0x00, 0x45, 0x00],
                        [0x00, 0x43, 0x48]
                    ],
                    [
                        [0x00, 0x00, 0x00],
                        [0x46, 0x4A, 0x48],
                        [0x41, 0x00, 0x00]
                    ],
                    [
                        [0x42, 0x4C, 0x00],
                        [0x00, 0x45, 0x00],
                        [0x00, 0x41, 0x00]
                    ]
                ],
                [
                    [
                        [0x00, 0x56, 0x5C, 0x00],
                        [0x00, 0x53, 0x59, 0x00],
                        [0x00, 0x00, 0x00, 0x00]
                    ],
                    [
                        [0x00, 0x56, 0x5C, 0x00],
                        [0x00, 0x53, 0x59, 0x00],
                        [0x00, 0x00, 0x00, 0x00]
                    ],
                    [
                        [0x00, 0x56, 0x5C, 0x00],
                        [0x00, 0x53, 0x59, 0x00],
                        [0x00, 0x00, 0x00, 0x00]
                    ],
                    [
                        [0x00, 0x56, 0x5C, 0x00],
                        [0x00, 0x53, 0x59, 0x00],
                        [0x00, 0x00, 0x00, 0x00]
                    ]
                ],
                [
                    [
                        [0x00, 0x66, 0x68],
                        [0x62, 0x69, 0x00],
                        [0x00, 0x00, 0x00]
                    ],
                    [
                        [0x00, 0x64, 0x00],
                        [0x00, 0x63, 0x6C],
                        [0x00, 0x00, 0x61]
                    ],
                    [
                        [0x00, 0x00, 0x00],
                        [0x00, 0x66, 0x68],
                        [0x62, 0x69, 0x00]
                    ],
                    [
                        [0x64, 0x00, 0x00],
                        [0x63, 0x6C, 0x00],
                        [0x00, 0x61, 0x00]
                    ]
                ],
                [
                    [
                        [0x00, 0x00, 0x00, 0x00],
                        [0x72, 0x7A, 0x7A, 0x78],
                        [0x00, 0x00, 0x00, 0x00],
                        [0x00, 0x00, 0x00, 0x00]
                    ],
                    [
                        [0x00, 0x00, 0x74, 0x00],
                        [0x00, 0x00, 0x75, 0x00],
                        [0x00, 0x00, 0x75, 0x00],
                        [0x00, 0x00, 0x71, 0x00]
                    ],
                    [
                        [0x00, 0x00, 0x00, 0x00],
                        [0x00, 0x00, 0x00, 0x00],
                        [0x72, 0x7A, 0x7A, 0x78],
                        [0x00, 0x00, 0x00, 0x00]
                    ],
                    [
                        [0x00, 0x74, 0x00, 0x00],
                        [0x00, 0x75, 0x00, 0x00],
                        [0x00, 0x75, 0x00, 0x00],
                        [0x00, 0x71, 0x00, 0x00]
                    ]
                ],
                [
                    [
                        [0x84, 0x00, 0x00],
                        [0x83, 0x8A, 0x88],
                        [0x00, 0x00, 0x00]
                    ],
                    [
                        [0x00, 0x86, 0x88],
                        [0x00, 0x85, 0x00],
                        [0x00, 0x81, 0x00]
                    ],
                    [
                        [0x00, 0x00, 0x00],
                        [0x82, 0x8A, 0x8C],
                        [0x00, 0x00, 0x81]
                    ],
                    [
                        [0x00, 0x84, 0x00],
                        [0x00, 0x85, 0x00],
                        [0x82, 0x89, 0x00]
                    ]
                ],
                [
                    [
                        [0x00, 0x94, 0x00],
                        [0x92, 0x9B, 0x98],
                        [0x00, 0x00, 0x00]
                    ],
                    [
                        [0x00, 0x94, 0x00],
                        [0x00, 0x97, 0x98],
                        [0x00, 0x91, 0x00]
                    ],
                    [
                        [0x00, 0x00, 0x00],
                        [0x92, 0x9E, 0x98],
                        [0x00, 0x91, 0x00]
                    ],
                    [
                        [0x00, 0x94, 0x00],
                        [0x92, 0x9D, 0x00],
                        [0x00, 0x91, 0x00]
                    ]
                ]
            ],
            centerOffset: [
                [0.5, 0.0],
                [0.5, 0.0],
                [0.0, 0.0],
                [0.5, 0.0],
                [0.0, -0.5],
                [0.5, 0.0],
                [0.5, 0.0]
            ],
            SRS: {
                JLSTZ: [
                    [
                        // 0 >> 1
                        [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
                        // 0 >> 3
                        [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]]
                    ],
                    [
                        // 1 >> 2
                        [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
                        // 1 >> 0
                        [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]]
                    ],
                    [
                        // 2 >> 3
                        [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
                        // 2 >> 1
                        [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]]
                    ],
                    [
                        // 3 >> 0
                        [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
                        // 3 >> 2
                        [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]]
                    ]
                ],
                I: [
                    [
                        // 0 >> 1
                        [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
                        // 0 >> 3
                        [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]]
                    ],
                    [
                        // 1 >> 2
                        [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
                        // 1 >> 0
                        [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]]
                    ],
                    [
                        // 2 >> 3
                        [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
                        // 2 >> 1
                        [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]]
                    ],
                    [
                        // 3 >> 0
                        [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
                        // 3 >> 2
                        [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]]
                    ]
                ],
                O: [
                    [
                        // 0 >> 1
                        [[0, 0]],
                        // 0 >> 3
                        [[0, 0]]
                    ],
                    [
                        // 1 >> 2
                        [[0, 0]],
                        // 1 >> 0
                        [[0, 0]]
                    ],
                    [
                        // 2 >> 3
                        [[0, 0]],
                        // 2 >> 1
                        [[0, 0]]
                    ],
                    [
                        // 3 >> 0
                        [[0, 0]],
                        // 3 >> 2
                        [[0, 0]]
                    ]
                ],
                getTests: null
            }
        },
        board: {
            data: Array(height + sy * 2).fill().map(() => new Uint8Array(width + sx * 2)),
            shadow: Array(height + sy * 2).fill().map(() => new Uint8Array(width + sx * 2)),
            clearingBuf: new Uint8Array(height),
            sx: sx,
            sy: sy,
            width: width,
            height: height,
            clear: null,
            pasteBlock: null,
            eraseBlock: null,
            pasteShadow: null,
            eraseShadow: null,
            testCollision: null,
            eraseLine: null,
            shift: null
        },
        next: {
            queue: Array(5).fill().map(() => {
                return {
                    data: null,
                    type: -1,
                    width: 0,
                    height: 0,
                    offset_x: 0,
                    offset_y: 0
                };
            }),
            update: null
        },
        hold: {
            block: {
                data: null,
                type: -1,
                width: 0,
                height: 0,
                offset_x: 0,
                offset_y: 0
            },
            type: null,
            hasHolded: false,
            clear: null,
            holdBlock: null
        },
        controller: {
            x: 0,
            y: 0,
            type: 0,
            rot: 0,
            previousState: {
                reset: () => { model.controller.previousState.x = model.controller.previousState.y = model.controller.previousState.rot = -1; },
                x: -1,
                y: -1,
                rot: -1
            },
            shadow: {
                x: 0,
                y: 0,
                type: 0,
                rot: 0
            },
            blockQueue: null,
            randomArray: null,
            cleanLines: null,
            generateBlock: null,
            getDropPlace: null,
            pasteShadow: null,
            rotateBlock: null,
            key: {
                moveLeft: null,
                moveRigh: null,
                softDrop: null,
                hardDrop: null,
                rotateLeft: null,
                rotateRight: null,
                rotate180: null,
                hold: null
            },
            reset: null,
            update: null
        },
        reset: null,
        update: null
    };
    // initial block
    model.block.SRS.getTests = (type, rot, dir) => {
        if (type == model.block.type.I) return model.block.SRS.I[rot][dir];
        else if (type == model.block.type.O) return model.block.SRS.O[rot][dir];
        return model.block.SRS.JLSTZ[rot][dir];
    };
    // initial board
    model.board.clear = () => {
        for (var i = 0; i < model.board.height; i++)
            for (var j = 0; j < model.board.width; j++)
                model.board.data[i + model.board.sy][j + model.board.sx] = 0x00;
        for (var i = 0; i < model.board.height; i++) {
            model.board.data[i + model.board.sy][model.board.sx - 1] = model.board.data[i + model.board.sy][model.board.width + model.board.sx] = 0x15;
        }
        for (var j = 0; j < model.board.width; j++) {
            model.board.data[model.board.sy - 1][j + model.board.sx] = 0x00;
            model.board.data[model.board.height + model.board.sy][j + model.board.sx] = 0x1A;
        }
        model.board.data[model.board.sy][model.board.sx - 1] = 0x14;
        model.board.data[model.board.sy - 1][model.board.sx - 1] = 0x14;
        model.board.data[model.board.height + model.board.sy][model.board.sx - 1] = 0x13;
        model.board.data[model.board.sy][model.board.width + model.board.sx] = 0x14;
        model.board.data[model.board.sy - 1][model.board.width + model.board.sx] = 0x14;
        model.board.data[model.board.height + model.board.sy][model.board.width + model.board.sx] = 0x19;
        // clear shadow
        for (var i = 0; i < model.board.height + 2 * model.board.sy; i++)
            for (var j = 0; j < model.board.width + 2 * model.board.sx; j++)
                model.board.shadow[i][j] = 0x00;
        // clear clearing buf
        for (var i = 0; i < model.board.height; i++)
            model.board.clearingBuf[i] = 0;
    };
    model.board.pasteBlock = (x, y, type, rot) => {
        for (var i = 0; i < model.block.size[type].height; i++)
            for (var j = 0; j < model.block.size[type].width; j++) {
                const cx = model.board.sx + x + j, cy = model.board.sy + y + i;
                model.board.data[cy][cx] |= model.block.data[type][rot][i][j];
                if (y + i >= 0)
                    model.board.clearingBuf[y + i] += !!model.block.data[type][rot][i][j];
            }
    };
    model.board.eraseBlock = (x, y, type, rot) => {
        for (var i = 0; i < model.block.size[type].height; i++)
            for (var j = 0; j < model.block.size[type].width; j++) {
                const cx = model.board.sx + x + j, cy = model.board.sy + y + i;
                model.board.data[cy][cx] -= model.block.data[type][rot][i][j];
                if (y + i >= 0)
                    model.board.clearingBuf[y + i] -= !!model.block.data[type][rot][i][j];
            }
    };
    model.board.pasteShadow = (x, y, type, rot) => {
        for (var i = 0; i < model.block.size[type].height; i++)
            for (var j = 0; j < model.block.size[type].width; j++) {
                const cx = model.board.sx + x + j, cy = model.board.sy + y + i;
                model.board.shadow[cy][cx] |= model.block.data[type][rot][i][j];
            }
    };
    model.board.eraseShadow = (x, y, type, rot) => {
        for (var i = 0; i < model.block.size[type].height; i++)
            for (var j = 0; j < model.block.size[type].width; j++) {
                const cx = model.board.sx + x + j, cy = model.board.sy + y + i;
                if (model.block.data[type][rot][i][j])
                    model.board.shadow[cy][cx] = 0x00;
            }
    };
    model.board.testCollision = (x, y, type, rot) => {
        var collisionTimes = 0;
        for (var i = 0; i < model.block.size[type].height; i++)
            for (var j = 0; j < model.block.size[type].width; j++) {
                const cx = model.board.sx + x + j, cy = model.board.sy + y + i;
                collisionTimes += !!(model.board.data[cy][cx] && model.block.data[type][rot][i][j]);
            }
        return collisionTimes;
    };
    model.board.eraseLine = (line) => {
        const iline = model.board.sy + line;
        for (var i = 0; i < model.board.width; i++) {
            model.board.data[iline][model.board.sx + i] = 0;
            model.board.data[iline - 1][model.board.sx + i] &= 0xFB;
            model.board.data[iline + 1][model.board.sx + i] &= 0xFE;
        }
        model.board.clearingBuf[line] = 0;
    };
    model.board.shift = (start, dest, lines) => {
        var buf_len = Math.min(start + 1, lines);
        var board_buf = Array(buf_len).fill().map(() => new Uint8Array(model.board.width));
        var clear_buf = new Uint8Array(buf_len);
        for (var i = 0; i < buf_len; i++) {
            for (var j = 0; j < model.board.width; j++) {
                board_buf[buf_len - i - 1][j] = model.board.data[model.board.sy + start - i][model.board.sx + j];
                model.board.data[model.board.sy + start - i][model.board.sx + j] = 0x00;
            }
            clear_buf[buf_len - i - 1] = model.board.clearingBuf[start - i];
            model.board.clearingBuf[start - i] = 0;
        }
        for (var i = 0; i < buf_len; i++) {
            if (dest - i < 0 || dest - i >= model.board.height)
                continue;
            for (var j = 0; j < model.board.width; j++)
                model.board.data[model.board.sy + dest - i][model.board.sx + j] = board_buf[buf_len - i - 1][j];
            model.board.clearingBuf[dest - i] = clear_buf[buf_len - i - 1];
        }
    };
    // initial next
    model.next.update = () => {
        for (var i = 0; i < 5; i++) {
            const type = model.controller.blockQueue[i];
            model.next.queue[i].data = model.block.data[type][0];
            model.next.queue[i].type = type;
            model.next.queue[i].width = model.block.size[type].width;
            model.next.queue[i].height = model.block.size[type].height;
            model.next.queue[i].offset_x = model.block.centerOffset[type][0];
            model.next.queue[i].offset_y = model.block.centerOffset[type][1];
        }
    };
    // initial hold
    model.hold.clear = () => {
        model.hold.block.data = Array(2).fill().map(() => new Uint8Array(4));
        model.hold.block.type = -1;
        model.hold.block.width = 4;
        model.hold.block.height = 2;
        model.hold.hasHolded = false;
    };
    model.hold.holdBlock = () => {
        if (model.hold.hasHolded)
            return false;
        model.board.eraseBlock(model.controller.x, model.controller.y, model.controller.type, model.controller.rot);
        if (model.hold.block.type != -1) {
            model.controller.blockQueue.unshift(model.hold.block.type);
        }
        model.hold.block.type = model.controller.type;
        model.controller.generateBlock();
        model.hold.hasHolded = true;
        model.hold.block.data = model.block.data[model.hold.block.type][0];
        model.hold.block.width = model.block.size[model.hold.block.type].width;
        model.hold.block.height = model.block.size[model.hold.block.type].height;
        model.hold.block.offset_x = model.block.centerOffset[model.hold.block.type][0];
        model.hold.block.offset_y = model.block.centerOffset[model.hold.block.type][1];
        return true;
    };
    // initial controller
    model.controller.randomArray = (src = [0, 1, 2, 3, 4, 5, 6]) => {
        for (var i = 0; i < src.length; i++) {
            var ri = Math.floor(Math.random() * src.length);
            src[ri] = [src[i], src[i] = src[ri]][0];
        }
        return src;
    };
    model.controller.cleanLines = () => {
        for (var i = model.board.height - 1; i >= 0;) {
            if (model.board.clearingBuf[i] == model.board.width) {
                model.board.eraseLine(i);
                model.board.shift(i - 1, i, model.board.height);
            }
            else
                i--;
        }
    };
    model.controller.generateBlock = () => {
        model.controller.cleanLines();
        // set new block property
        const type = model.controller.blockQueue.shift();
        model.controller.x = Math.floor((model.board.width - model.block.size[type].width) / 2);
        model.controller.y = -1;
        model.controller.type = type;
        model.controller.rot = 0;
        // test if generate block failed
        if (model.board.testCollision(model.controller.x, model.controller.y, model.controller.type, model.controller.rot)) {
            model.controller.blockQueue.unshift(type);
            return false;
        }
        // set previous state
        model.controller.previousState.reset();
        // add new blocks to queue
        if (model.controller.blockQueue.length < 14)
            model.controller.blockQueue =
                model.controller.blockQueue.concat(
                    model.controller.randomArray(Array(2 * 7).fill().map((value, index) => index % 7)));
        // generate block
        model.board.pasteBlock(model.controller.x, model.controller.y, model.controller.type, model.controller.rot);
        // paste shadow
        model.controller.pasteShadow();
        // update next queue
        model.next.update();
        // set hold block
        model.hold.hasHolded = false;
        return true;
    };
    model.controller.getDropPlace = () => {
        var state = {
            x: model.controller.x,
            y: model.controller.y,
            type: model.controller.type,
            rot: model.controller.rot
        };
        model.board.eraseBlock(model.controller.x, model.controller.y, model.controller.type, model.controller.rot);
        while (true) {
            if (model.board.testCollision(state.x, state.y + 1, state.type, state.rot))
                break;
            state.y += 1;
        }
        model.board.pasteBlock(model.controller.x, model.controller.y, model.controller.type, model.controller.rot);
        return state;
    };
    model.controller.pasteShadow = () => {
        model.board.eraseShadow(model.controller.shadow.x, model.controller.shadow.y, model.controller.shadow.type, model.controller.shadow.rot);
        const state = model.controller.getDropPlace();
        model.controller.shadow.x = state.x;
        model.controller.shadow.y = state.y;
        model.controller.shadow.type = state.type;
        model.controller.shadow.rot = state.rot;
        model.board.pasteShadow(model.controller.shadow.x, model.controller.shadow.y, model.controller.shadow.type, model.controller.shadow.rot);
    };
    model.controller.rotateBlock = (dir) => {
        var moved = false;
        var new_rot = (model.controller.rot + 5 - 2 * dir) % 4;
        // get wall kick tests
        var rot_tests = model.block.SRS.getTests(model.controller.type, model.controller.rot, dir);
        model.board.eraseBlock(model.controller.x, model.controller.y, model.controller.type, model.controller.rot);
        // start testing
        for (var i = 0; i < rot_tests.length; i++) {
            const nx = model.controller.x + rot_tests[i][0];
            const ny = model.controller.y - rot_tests[i][1];
            if (!model.board.testCollision(nx, ny, model.controller.type, new_rot)) {
                model.controller.x = nx;
                model.controller.y = ny;
                model.controller.rot = new_rot;
                moved = true;
                break;
            }
        }
        model.board.pasteBlock(model.controller.x, model.controller.y, model.controller.type, model.controller.rot);
        model.controller.pasteShadow();
        return moved;
    };
    model.controller.key.moveLeft = () => {
        var moved = false;
        model.board.eraseBlock(model.controller.x, model.controller.y, model.controller.type, model.controller.rot);
        if (!model.board.testCollision(model.controller.x - 1, model.controller.y, model.controller.type, model.controller.rot)) {
            model.controller.x -= 1;
            model.controller.previousState.reset();
            moved = true;
        }
        model.board.pasteBlock(model.controller.x, model.controller.y, model.controller.type, model.controller.rot);
        model.controller.pasteShadow();
        return moved;
    };
    model.controller.key.moveRigh = () => {
        var moved = false;
        model.board.eraseBlock(model.controller.x, model.controller.y, model.controller.type, model.controller.rot);
        if (!model.board.testCollision(model.controller.x + 1, model.controller.y, model.controller.type, model.controller.rot)) {
            model.controller.x += 1;
            model.controller.previousState.reset();
            moved = true;
        }
        model.board.pasteBlock(model.controller.x, model.controller.y, model.controller.type, model.controller.rot);
        model.controller.pasteShadow();
        return moved;
    };
    model.controller.key.softDrop = () => {
        var moved = false;
        model.board.eraseBlock(model.controller.x, model.controller.y, model.controller.type, model.controller.rot);
        if (!model.board.testCollision(model.controller.x, model.controller.y + 1, model.controller.type, model.controller.rot)) {
            model.controller.y += 1;
            model.controller.previousState.reset();
            moved = true;
        }
        model.board.pasteBlock(model.controller.x, model.controller.y, model.controller.type, model.controller.rot);
        return moved;
    };
    model.controller.key.hardDrop = () => {
        var state = model.controller.getDropPlace();
        model.board.eraseBlock(model.controller.x, model.controller.y, model.controller.type, model.controller.rot);
        model.controller.x = state.x;
        model.controller.y = state.y;
        model.controller.type = state.type;
        model.controller.rot = state.rot;
        model.board.pasteBlock(model.controller.x, model.controller.y, model.controller.type, model.controller.rot);
        return model.controller.generateBlock();
    };
    model.controller.key.rotateLeft = () => {
        return model.controller.rotateBlock(1);
    };
    model.controller.key.rotateRight = () => {
        return model.controller.rotateBlock(0);
    };
    model.controller.key.rotate180 = () => {

    };
    model.controller.key.hold = () => {
        return model.hold.holdBlock();
    };
    model.controller.reset = () => {
        model.controller.blockQueue =
            model.controller.randomArray(Array(7).fill().map((value, index) => index % 7)).concat(
                model.controller.randomArray(Array(2 * 7).fill().map((value, index) => index % 7)));
        model.controller.generateBlock();
    };
    model.controller.update = () => {
        model.controller.key.softDrop();
        // if block unchanged, then next block
        if (model.controller.x == model.controller.previousState.x &&
            model.controller.y == model.controller.previousState.y &&
            model.controller.type == model.controller.previousState.type &&
            model.controller.rot == model.controller.previousState.rot) {
            return model.controller.generateBlock();
        }
        model.controller.previousState.x = model.controller.x;
        model.controller.previousState.y = model.controller.y;
        model.controller.previousState.type = model.controller.type;
        model.controller.previousState.rot = model.controller.rot;
        return true;
    };
    // initial model
    model.reset = () => {
        model.board.clear();
        model.controller.reset();
        model.hold.clear();
    };
    model.update = () => {
        var succ = model.controller.update();
        return succ;
    };
    model.board.clear();
    model.controller.reset();
    return model;
}

function CreateController(model, view, kwargs = {
    DRR: 500,    // drop repeat rate
    DAS: 100,    // delay auto shift
    ARR: 50,     // auto repeat rate
    SDDAS: 50,   // soft drop DAS
    SDARR: 20,   // soft drop ARR
    screenSpeed: 10,
    keys: {
        moveLeft: 37,
        moveRight: 39,
        softDrop: 40,
        hardDrop: 32,
        rotateLeft: 90,
        rotateRight: 38,
        rotate180: 65,
        holdBlock: 67
    }
}) {
    var controller = {
        model: model,
        view: view,
        DRR: kwargs.DRR,
        DAS: kwargs.DAS,
        ARR: kwargs.ARR,
        SDDAS: kwargs.SDDAS,
        SDARR: kwargs.SDARR,
        screenSpeed: kwargs.screenSpeed,
        initial: null,
        modelUpdate: null,
        viewUpdate: null,
        modelTimer: null,
        viewTimer: null,
        setModelTimer: null,
        keyAction: {
            moveLeft: kwargs.keys.moveLeft,
            moveRight: kwargs.keys.moveRight,
            softDrop: kwargs.keys.softDrop,
            hardDrop: kwargs.keys.hardDrop,
            rotateLeft: kwargs.keys.rotateLeft,
            rotateRight: kwargs.keys.rotateRight,
            rotate180: kwargs.keys.rotate180,
            holdBlock: kwargs.keys.holdBlock
        },
        keyState: {},
        newKeyAction: null,
        keyDown: null,
        keyUp: null,
        keyFunctions: {
            moveLeft: null,
            moveRight: null,
            softDrop: null,
            hardDrop: null,
            rotateLeft: null,
            rotateRight: null,
            rotate180: null,
            holdBlock: null
        },
        start: null,
        destroy: null
    };
    controller.initial = () => {
        controller.model.board.clear();
        controller.view.board.update(controller.model.board.data, controller.model.board.shadow);
        controller.model.reset();
        controller.view.board.update(controller.model.board.data, controller.model.board.shadow);
    };
    controller.modelUpdate = () => {
        if (!controller.model.update()) {
            controller.model.reset();
        }
    };
    controller.viewUpdate = () => {
        controller.view.board.update(controller.model.board.data, controller.model.board.shadow);
        controller.view.next.update(controller.model.next.queue);
        controller.view.hold.update(controller.model.hold.block);
    };
    controller.setModelTimer = () => {
        if (controller.modelTimer)
            clearInterval(controller.modelTimer);
        controller.modelTimer = setInterval(() => controller.modelUpdate(), controller.DRR);
    };
    controller.newKeyAction = (func = null, delay = 0, speed = 0) => {
        var action = {
            enable: false,
            timer: null
        };
        if (func) {
            action.enable = true;
            func();
            setTimeout(() => {
                if (action.enable)
                    action.timer = setInterval(() => {
                        if (action.enable)
                            func();
                        else
                            clearInterval(action.timer);
                    }, speed);
            }, delay);
        }
        return action;
    };
    controller.keyDown = (e) => {
        if (!controller.keyState[e.keyCode])
            controller.keyState[e.keyCode] = {
                press: false,
                keyActionBuffer: Array(5).fill().map(() => controller.newKeyAction())
            };
        if (!controller.keyState[e.keyCode].press) {
            switch (e.keyCode) {
                case controller.keyAction.moveLeft:
                    try {
                        controller.keyState[controller.keyAction.moveRight].keyActionBuffer.forEach(value => { value.enable = false; });
                    } catch (e) { }
                    controller.keyState[e.keyCode].keyActionBuffer.pop();
                    controller.keyState[e.keyCode].keyActionBuffer.unshift(
                        controller.newKeyAction(
                            controller.keyFunctions.moveLeft,
                            controller.DAS,
                            controller.ARR
                        )
                    );
                    break;
                case controller.keyAction.moveRight:
                    try {
                        controller.keyState[controller.keyAction.moveLeft].keyActionBuffer.forEach(value => { value.enable = false; });
                    } catch (e) { }
                    controller.keyState[e.keyCode].keyActionBuffer.pop();
                    controller.keyState[e.keyCode].keyActionBuffer.unshift(
                        controller.newKeyAction(
                            controller.keyFunctions.moveRight,
                            controller.DAS,
                            controller.ARR
                        )
                    );
                    break;
                case controller.keyAction.softDrop:
                    controller.keyState[e.keyCode].keyActionBuffer.pop();
                    controller.keyState[e.keyCode].keyActionBuffer.unshift(
                        controller.newKeyAction(
                            controller.keyFunctions.softDrop,
                            controller.SDDAS,
                            controller.SDARR
                        )
                    );
                    break;
                case controller.keyAction.hardDrop:
                    controller.keyFunctions.hardDrop();
                    break;
                case controller.keyAction.rotateLeft:
                    controller.keyFunctions.rotateLeft();
                    break;
                case controller.keyAction.rotateRight:
                    controller.keyFunctions.rotateRight();
                    break;
                case controller.keyAction.rotate180:
                    controller.keyFunctions.rotate180();
                    break;
                case controller.keyAction.holdBlock:
                    controller.keyFunctions.holdBlock();
                    break;
            }
        }
        controller.keyState[e.keyCode].press = true;
    };
    controller.keyUp = (e) => {
        if (controller.keyState[e.keyCode].press) {
            switch (e.keyCode) {
                case controller.keyAction.moveLeft:
                case controller.keyAction.moveRight:
                case controller.keyAction.softDrop:
                    controller.keyState[e.keyCode].keyActionBuffer.forEach(value => { value.enable = false; });
                    break;
                case controller.keyAction.hardDrop:
                case controller.keyAction.rotateLeft:
                case controller.keyAction.rotateRight:
                case controller.keyAction.rotate180:
                case controller.keyAction.holdBlock:
                    break;
            }
        }
        controller.keyState[e.keyCode].press = false;
    };
    controller.keyFunctions.moveLeft = () => {
        controller.model.controller.key.moveLeft();
    };
    controller.keyFunctions.moveRight = () => {
        controller.model.controller.key.moveRigh();
    };
    controller.keyFunctions.softDrop = () => {
        if (controller.model.controller.key.softDrop())
            controller.setModelTimer();
    };
    controller.keyFunctions.hardDrop = () => {
        if (!controller.model.controller.key.hardDrop())
            controller.model.reset();
        controller.setModelTimer();
    };
    controller.keyFunctions.rotateLeft = () => {
        controller.model.controller.key.rotateLeft();
    };
    controller.keyFunctions.rotateRight = () => {
        controller.model.controller.key.rotateRight();
    };
    controller.keyFunctions.rotate180 = () => {
        controller.model.controller.key.rotate180();
    };
    controller.keyFunctions.holdBlock = () => {
        controller.model.controller.key.hold();
    };
    controller.start = () => {
        controller.initial();
        // model
        controller.setModelTimer();
        // view
        controller.viewTimer = setInterval(() => controller.viewUpdate(), controller.screenSpeed);
    };
    controller.destroy = () => {
        if (controller.modelTimer) {
            clearInterval(controller.modelTimer);
            controller.modelTimer = null;
        } else return false;
        if (controller.viewTimer) {
            clearInterval(controller.viewTimer);
            controller.viewTimer = null;
        } else return false;
        for (key in controller.keyState)
            controller.keyState[key].keyActionBuffer.forEach(value => { value.enable = false; });
        // document.onkeydown = null;
        // document.onkeyup = null;
        return true;
    };
    document.onkeydown = controller.keyDown;
    document.onkeyup = controller.keyUp;
    return controller;
}

function CreateTetris(board, next1, next2, next3, next4, next5, hold, style = "white", kwargs = {
    control: {
        DRR: 500,
        DAS: 100,
        ARR: 50,
        SDDAS: 50,
        SDARR: 20,
        screenSpeed: 10,
        keys: {
            moveLeft: 37,
            moveRight: 39,
            softDrop: 40,
            hardDrop: 32,
            rotateLeft: 90,
            rotateRight: 38,
            rotate180: 65,
            holdBlock: 67
        },
        details: {
            width: 10,
            height: 20
        }
    }
}) {
    try {
        board = getCanvasElement(board);
        next1 = getCanvasElement(next1);
        next2 = getCanvasElement(next2);
        next3 = getCanvasElement(next3);
        next4 = getCanvasElement(next4);
        next5 = getCanvasElement(next5);
        hold = getCanvasElement(hold);
    }
    catch (e) { throw e; }
    function randomArray(src) {
        for (var i = 0; i < src.length; i++) {
            var ri = Math.floor(Math.random() * src.length);
            src[ri] = [src[i], src[i] = src[ri]][0];
        }
        return src;
    };
    const block_texture = randomArray(
        [
            3, 4, 5,
            6, 7, 9, 10,
            11, 12, 13, 14,
            15, 16, 17, 18,
            19, 20, 21, 22,
            23, 24
        ]
    )[0], shadow_texture = randomArray(
        [
            1, 24
        ]
    )[0];
    // MVC software design pattern
    var obj = {
        model: CreateModel(kwargs.control.details.width, kwargs.control.details.height),
        view: CreateView({
            board: board,
            next: [next1, next2, next3, next4, next5],
            hold: hold
        }, {
            block: {
                texture: {
                    block: "assets/" + style + "/texture" + block_texture + ".png",
                    shadow: "assets/" + style + "/texture" + shadow_texture + "_shadow.png"
                },
                width: 32,
                height: 32
            },
            board: {
                sx: 5,
                sy: 6,
                width: kwargs.control.details.width + 2,
                height: kwargs.control.details.height + 1
            },
            next: {
                sx: 1,
                sy: 1,
                width: 4,
                height: 4
            },
            hold: {
                sx: 1,
                sy: 1,
                width: 4,
                height: 4
            }
        }),
        controller: null,
        destroy: null
    };
    obj.controller = CreateController(obj.model, obj.view, kwargs.control);
    // destructor
    obj.destroy = () => {
        var destroyer = setInterval(() => {
            if (obj.controller.destroy())
                clearInterval(destroyer);
        }, 0);
    }
    // start tetris
    obj.controller.start();
    return obj;
}