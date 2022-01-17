import { Eventer } from '@townland-project/eventer';

export let Event: Eventer<TEvents>;

export function SetEventer(eventer: Eventer<TEvents>): void {
    Event = eventer;
}

type TEvents = 'scene:load' | 'scene:load:submit' |
    'character:spawn' | 'character:left' | 'character:change' | 'character:click' | 'character:position:change' |
    'character:owner:set' | 'character:owner:position:change' |
    'room:character:speed:set' | 'room:background:set' | 'room:clear';