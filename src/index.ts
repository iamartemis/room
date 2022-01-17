import { Eventer } from '@townland-project/eventer';
import { SetEventer } from './core/eventer';
import { RoomScene } from './scene';

export function GenerateRoomScene(eventer: Eventer<any>): typeof Phaser.Scene {
    SetEventer(eventer)
    return RoomScene;
}