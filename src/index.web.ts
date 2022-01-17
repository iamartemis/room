import { ICDNAssets, ICharacter } from "@townland-project/interfaces";
import { Eventer } from "@townland-project/eventer";
import { Caches, CacheStorage } from "@townland-project/cache"
import { Game } from "phaser";
import { GenerateRoomScene } from ".";
import { Event } from "./core/eventer";

export const Config = new Game({
    type: Phaser.AUTO,
    width: 2048,
    height: 1080,
    physics: {
        default: 'arcade',
        arcade: {
            debug: true,
            gravity: { y: 0 },
        }
    },
    scene: [
        GenerateRoomScene(new Eventer<any>())
    ]
});

// fake data
window.onload = async () => {
    let character: ICharacter = {
        username: 'root',
        dna: '',
        access: 'admin',
        gender: 'male',
        dress: {
            body: 'm-base1',
            eyes: 'm-eyes1',
            mouth: 'm-mouth1',
            tops: 'm-tops1',
            bottoms: 'm-bottom1',
            shoes: 'm-shoes1'
        }
    }

    await Promise.all([
        Load(Caches.Room, 'room'),
        Load(Caches.Character, 'character'),
    ]);
    await Event.emit('scene:load:submit')
    setTimeout(() => {
        Event.emit('room:background:set', 'room:cafe')
        Event.emit('character:spawn', character)
        Event.emit('character:owner:set', character.username)
    }, 500);
}

async function Load(storage: CacheStorage, name: string) {
    let res = await storage.GetJson(`https://cdn.townland.xyz/${name}.json`)
    let assets: ICDNAssets = await res?.json()
    let keys = Object.keys(assets.item)
    for (let key of keys) {
        await storage.AddImage(assets.item[key]);
        Event.emit('scene:load', {
            key: key,
            uri: assets.item[key]
        })
    }
}