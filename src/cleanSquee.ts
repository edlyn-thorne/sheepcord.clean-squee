/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

// @ts-nocheck (bruh)
import { definePluginSettings } from "@api/Settings";
import { makeRange } from "@components/PluginSettings/components/SettingSliderComponent";
import { sleep } from "@utils/misc";
import definePlugin, { OptionType } from "@utils/types";
import { RelationshipStore, SelectedChannelStore, UserStore } from "@webpack/common";
import { Message, ReactionEmoji } from "discord-types/general";

interface IMessageCreate {
    type: "MESSAGE_CREATE";
    optimistic: boolean;
    isPushNotification: boolean;
    channelId: string;
    message: Message;
}

interface IReactionAdd {
    type: "MESSAGE_REACTION_ADD";
    optimistic: boolean;
    channelId: string;
    messageId: string;
    messageAuthorId: string;
    userId: "195136840355807232";
    emoji: ReactionEmoji;
}

interface IVoiceChannelEffectSendEvent {
    type: string;
    emoji?: ReactionEmoji;
    channelId: string;
    userId: string;
    animationType: number;
    animationId: number;
}

const soundEffectURL = "https://raw.githubusercontent.com/MeguminSama/VencordPlugins/main/plugins/moyai/moyai.mp3";

const pluginSettings = definePluginSettings({
    volume: {
        description: "Volume of the sound effect:",
        type: OptionType.SLIDER,
        markers: makeRange(0, 1, 0.1),
        default: 0.5,
        stickToMarkers: false
    },
    triggerWhenUnfocused: {
        description: "Trigger the sound effect even when the window is unfocused:",
        type: OptionType.BOOLEAN,
        default: true
    },
    ignoreBots: {
        description: "Ignore bots:",
        type: OptionType.BOOLEAN,
        default: true
    },
    ignoreBlocked: {
        description: "Ignore blocked users:",
        type: OptionType.BOOLEAN,
        default: true
    }
});

export default definePlugin({
    name: "Clean Squee",
    authors: [{
        name: "Arlen Freii",
        id: 561136847191801867n
    }],
    description: "Does nothing, but...",
    settings: pluginSettings,

    flux: {
        async MESSAGE_CREATE({ optimistic, type, message, channelId }: IMessageCreate) {
            if (optimistic || type !== "MESSAGE_CREATE") return;
            if (message.state === "SENDING") return;
            if (pluginSettings.store.ignoreBots && message.author?.bot) return;
            if (pluginSettings.store.ignoreBlocked && RelationshipStore.isBlocked(message.author?.id)) return;
            if (!message.content) return;
            if (channelId !== SelectedChannelStore.getChannelId()) return;

            const playCount = playCountOf(message.content);

            for (let i = 0; i < playCount; i++) {
                playSound();
                await sleep(150);
            }
        },

        MESSAGE_REACTION_ADD({ optimistic, type, channelId, userId, messageAuthorId, emoji }: IReactionAdd) {
            if (optimistic || type !== "MESSAGE_REACTION_ADD") return;
            if (pluginSettings.store.ignoreBots && UserStore.getUser(userId)?.bot) return;
            if (pluginSettings.store.ignoreBlocked && RelationshipStore.isBlocked(messageAuthorId)) return;
            if (channelId !== SelectedChannelStore.getChannelId()) return;

            const name = emoji.name.toLowerCase();
            console.log(name, soundEffectEmote, name !== soundEffectEmote);
            if (name === soundEffectEmote) playSound();
        },

        VOICE_CHANNEL_EFFECT_SEND({ emoji }: IVoiceChannelEffectSendEvent) {
            if (!emoji?.name) return;

            const name = emoji.name.toLowerCase();
            if (name === soundEffectEmote) playSound();
        }
    }
});

const soundEffectSubstring = "<:AYAYA:1210130354493460490>";
const soundEffectEmote = "ayaya";

function playCountOf(content: string) {
    console.log(content);
    let i = 0;
    let lastIndex = 0;
    while ((lastIndex = content.indexOf(soundEffectSubstring, lastIndex) + 1) !== 0) i++;

    console.log(i);

    return Math.min(i, 10);
}

function playSound() {
    if (!pluginSettings.store.triggerWhenUnfocused && !document.hasFocus()) return;

    const audioElement = document.createElement("audio");
    audioElement.src = soundEffectURL;
    audioElement.volume = pluginSettings.store.volume;

    audioElement.play();
}