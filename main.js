/**@type {HTMLCanvasElement} */
let canvas = document.getElementById('game');

canvas.width = innerWidth;
canvas.height = innerHeight;

const TILE_SIZE = 90;
const CHUNK_SIZE = 20;

const SPEED = 5;
const RUN_SPEED = 2;

const IMAGES = {
    grass: (() => {
        let img = new Image();
        img.src = "../img/grass.jpg";

        return img
    })(),
    sand: (() => {
        let img = new Image();
        img.src = "../img/sand.png";

        return img;
    })(),
    water: (() => {
        let img = new Image();
        img.src = "../img/water.jpg";

        return img;
    })()
}

const SEED = Math.random() * 100
const SCALE = .01;

noise.seed(SEED);
document.getElementById('seed').innerText = SEED;

let ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

addEventListener('resize', () => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    ctx.imageSmoothingEnabled = false;
});

let world = {
    x: 0,
    y: 0,
    chunks: [],
    add(chunk) {
        this.chunks.push(chunk);
    }
}

class Chunk {
    constructor(x, y, matrix) {
        this.x = x;
        this.y = y;
        this.matrix = matrix;
    }

    static GenerateChunk(chunkX, chunkY, size) {
        let matrix = [];

        for (let x = 0; x < size; x++)
            for (let y = 0; y < size; y++)
                matrix.push({ x: x + chunkX, y: y + chunkY, color: getColorTile(x + chunkX, y + chunkY).color, img: getColorTile(x + chunkX, y + chunkY).img })

        return new Chunk(chunkX, chunkY, matrix);
    }

    static Template(x, y) {
        return new Chunk(x, y, []);
    }

    static chunkVisible(chunk) {
        const { x, y } = chunk;
        const { width: gameW, height: gameH } = canvas;

        const realChunkSize = CHUNK_SIZE * TILE_SIZE;
        const chunkX = x * realChunkSize / CHUNK_SIZE;
        const chunkY = y * realChunkSize / CHUNK_SIZE;

        const gameX = world.x;
        const gameY = world.y;

        return (
            chunkX <= gameW + gameX &&
            chunkX + realChunkSize >= gameX &&
            chunkY <= gameH + gameY &&
            chunkY + realChunkSize >= gameY
        )
    }

    tileVisible(tile) {
        const { x, y } = tile;
        const { width: gameW, height: gameH } = canvas;

        const tileX = x * TILE_SIZE;
        const tileY = y * TILE_SIZE;

        const gameX = world.x;
        const gameY = world.y;

        return (
            tileX <= gameW + gameX &&
            tileX + TILE_SIZE >= gameX &&
            tileY <= gameH + gameY &&
            tileY + TILE_SIZE >= gameY
        )
    }

    /**
     * @param {CanvasRenderingContext2D} ctx 
     */
    drawTiles(ctx) {
        this.matrix
            .filter(this.tileVisible.bind(this))
            .forEach(e => {
                if (e.img) {
                    // console.log(e.imgData.poss)
                    ctx.drawImage(e.img, (e.x * TILE_SIZE) - world.x, (e.y * TILE_SIZE) - world.y, TILE_SIZE, TILE_SIZE)
                } else {
                    ctx.fillStyle = e.color;
                    ctx.fillRect((e.x * TILE_SIZE) - world.x, (e.y * TILE_SIZE) - world.y, TILE_SIZE, TILE_SIZE);
                }
            })
    }

    visibleInGame() {
        return Chunk.chunkVisible(this);
    }
}

function getColorTile(x, y) {
    const value = noise.perlin2(x * SCALE, y * SCALE);
    if (value < .25)
        return { color: "rgb(60, 255, 50)", img: IMAGES.grass }
    else if (value < .40)
        return { color: "rgb(700, 255, 0)", img: IMAGES.sand }
    else
        return { color: "rgb(50, 70, 255)", img: IMAGES.water }
}

let keys = {};

addEventListener('keydown', e =>  keys[e.key.toUpperCase()] = { shift: e.shiftKey, ctrl: e.ctrlKey });
addEventListener('keyup', e => delete keys[e.key.toUpperCase()]);

world.chunks.push(Chunk.GenerateChunk(0, 0, CHUNK_SIZE));

function loop() {
    let speed = SPEED;

    if (Object.keys(keys).includes("SHIFT"))
        speed = SPEED + RUN_SPEED

    if (Object.keys(keys).includes('W')) world.y -= speed;
    if (Object.keys(keys).includes('A')) world.x -= speed;
    if (Object.keys(keys).includes('S')) world.y += speed;
    if (Object.keys(keys).includes('D')) world.x += speed;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    getVisibleChunk()
        .forEach(value => {
            if (!getVisibleChunk().find(e => e.x == value.x + CHUNK_SIZE && e.y == value.y) && Chunk.Template(value.x + CHUNK_SIZE, value.y).visibleInGame()) {
                world.add(Chunk.GenerateChunk(value.x + CHUNK_SIZE, value.y, CHUNK_SIZE));
            }

            if (!getVisibleChunk().find(e => e.x == value.x && e.y == value.y + CHUNK_SIZE) && Chunk.Template(value.x, value.y + CHUNK_SIZE).visibleInGame()) {
                world.add(Chunk.GenerateChunk(value.x, value.y + CHUNK_SIZE, CHUNK_SIZE));
            }

            if (!getVisibleChunk().find(e => e.x == value.x - CHUNK_SIZE && e.y == value.y) && Chunk.Template(value.x - CHUNK_SIZE, value.y).visibleInGame()) {
                world.add(Chunk.GenerateChunk(value.x - CHUNK_SIZE, value.y, CHUNK_SIZE));
            }

            if (!getVisibleChunk().find(e => e.x == value.x && e.y == value.y - CHUNK_SIZE) && Chunk.Template(value.x, value.y - CHUNK_SIZE).visibleInGame()) {
                world.add(Chunk.GenerateChunk(value.x, value.y - CHUNK_SIZE, CHUNK_SIZE));
            }

            value.drawTiles(ctx);
        });


    requestAnimationFrame(loop);
}

const getVisibleChunk = () => world.chunks.filter(e => Chunk.chunkVisible(e));

loop();
