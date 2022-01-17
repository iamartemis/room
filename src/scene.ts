import { ICharacter } from '@townland-project/interfaces';
import { Event } from './core/eventer';

export class RoomScene extends Phaser.Scene {
    private _Key!: Phaser.Types.Input.Keyboard.CursorKeys;
    // main character that can move
    private _OwnerCharacterUsername?: string;
    private _Characters: ICharacterMap = {}
    private _WorldSpeed: number = 10;
    private _OwnerMoveTimeout: any;
    private _Background!: Phaser.GameObjects.Image;

    constructor() {
        super('scene-room');
    }

    init() {
        this._Key = this.input.keyboard.createCursorKeys()

        Event.on('room:background:set', (name: string) => {
            this._Background?.setTexture(name)
            let width = this._Background?.displayWidth;
            let height = this._Background?.displayHeight;
            this.cameras.main.setBounds(0, 0, width, height);
            this.physics.world.setBounds(0, 0, width - 450, height - 400, true, true, true, true)
        })

        Event.on('room:clear', () => {
            Object.keys(this._Characters).forEach((username: string) => {
                this._Characters[username].destroy()
            })
        })

        Event.on('character:spawn', (character: ICharacter) => {
            this.SpawnCharacter(character)
        })

        Event.on('character:left', (username: string) => {
            this._Characters[username].destroy()
        })

        Event.on('character:change', (character: ICharacter) => {
            this._UpdateCharacter(character);
        })

        Event.on('character:owner:set', (username: string) => {
            this._OwnerCharacterUsername = username;
            const Character: Phaser.Physics.Arcade.StaticGroup = this._Characters[username];
            const Child = (<Phaser.GameObjects.Image>Character.getChildren()[0])
            this.cameras.main.startFollow(
                Child,
            )
        })

        Event.on('character:position:change', (position: ICharacterPosition) => {
            // if character that change position was character owner
            if (position.username == this._OwnerCharacterUsername) return;
            const Character: Phaser.Physics.Arcade.StaticGroup = this._Characters[position.username];
            // if character is not exist in map
            if (!Character) return;
            // set character position
            Character.setXY(position.x, position.y);
        })

        Event.on('room:character:speed:set', (speed: number) => {
            this._WorldSpeed = speed;
        })
    }

    preload() {
        Event.on('scene:load', (asset: ISceneAssetLoad) => {
            this.load.crossOrigin = 'anonymous';
            if (asset.uri.split('/').pop()?.includes('.svg'))
                this.load.svg(asset.key, asset.uri, { scale: 0.3 });
            else
                this.load.image(asset.key, asset.uri);
        })

        Event.on('scene:load:submit', () => {
            this.load.start()
        })
    }

    create() {
        this.CreateBackground()
    }

    update() {
        // if owner character username not set
        if (!this._OwnerCharacterUsername) return;
        const Character: Phaser.Physics.Arcade.StaticGroup = this._Characters[this._OwnerCharacterUsername];
        // if owner charcter is not exist in map
        if (!Character) return;
        clearTimeout(this._OwnerMoveTimeout);

        if (this._Key.down.isDown)
            Character.incY(this._WorldSpeed)

        if (this._Key.up.isDown)
            Character.incY(this._WorldSpeed * -1)

        if (this._Key.left.isDown)
            Character.incX(this._WorldSpeed * -1)

        if (this._Key.right.isDown)
            Character.incX(this._WorldSpeed)

        if (this._Key.right.isUp || this._Key.left.isUp || this._Key.up.isUp || this._Key.down.isUp) {
            this._OwnerMoveTimeout = setTimeout(() => {
                let child = (<Phaser.GameObjects.Image>Character.getChildren()[0])
                Event.emit('character:owner:position:change', { username: this._OwnerCharacterUsername, x: child.x, y: child.y })
            }, 1000);
        }
    }

    CreateBackground(): void {
        let image = this.add.image(800, 600, "")
        image.setOrigin(0.2, 0.2)
        image.setScale(5)
        image.setInteractive()
        image.setName('background')
        this._Background = image
    }

    SpawnCharacter(character: ICharacter): void {
        let group: Phaser.Physics.Arcade.StaticGroup = this._CreateCharacter(character);

        group.on('click', () => {
            Event.emit('character:click', character.username)
        })

        this._Characters[character.username] = group;
    }

    private _CreateCharacter(character: ICharacter): Phaser.Physics.Arcade.StaticGroup {
        let group = this.physics.add.staticGroup() // new physic group
        group.setName(`character:${character.username}`) // set a name for group

        let container = this.add.container(0, 0)
        container.setSize(200, 330);
        this.physics.world.enable(container);

        (<any>container.body).setCollideWorldBounds(true);

        // create character dresses
        Object.keys(character.dress)
            .forEach(key => {
                // create character dress texture key
                let texture = `${character.gender}:${key}:${(<any>character.dress)[key]}`
                // create image
                let image = this.add.image(0, 15, texture)
                //  set image size
                image.setSize(200, 300)
                // image.setOrigin(0.5, 0.5)
                // set image can interactive
                image.setInteractive()
                // set a name for image
                image.setName(`character:${character.username}:${key}`)
                // on image click
                image.on('pointerdown', () => group.emit('click'))
                // add image to new group
                container.add(image)
            })

        // create username text upper of image
        let username = this.add.text(0, 0, character.username, {
            align: 'center',
            font: '20px Arial',
            color: UsernameColor[character.access]
        })
        // set username origin
        username.setOrigin(0.5, 7)
        // set username name
        username.setName(`character:${character.username}:username`);
        // add username text to new group
        container.add(username);

        group.add(container);

        return group;
    }

    private _UpdateCharacter(character: ICharacter): void {
        const OldCharacter = this._Characters[character.username];
        if (!OldCharacter) return;
        const child = (<Phaser.GameObjects.Image>OldCharacter.getChildren()[0])
        const x = child.x, y = child.y;
        OldCharacter.destroy();
        const Character: Phaser.Physics.Arcade.StaticGroup = this._CreateCharacter(character);
        Character.setXY(x, y);
        this._Characters[character.username] = Character;
    }
}


const UsernameColor: IUsernameColor = {
    admin: "#f44336",
    root: "transparent",
    vip: "#03a9f4",
    member: "#00c853"
}

interface IUsernameColor {
    admin: string
    root: string
    vip: string
    member: string
}

interface ICharacterMap {
    [key: string]: Phaser.Physics.Arcade.StaticGroup
}

interface ICharacterPosition {
    username: string
    x: number
    y: number
}

interface ISceneAssetLoad {
    key: string
    uri: string
}