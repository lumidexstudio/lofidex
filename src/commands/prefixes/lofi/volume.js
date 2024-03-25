const { AudioPlayerStatus, getVoiceConnection } = require('@discordjs/voice');
const { ActionRowBuilder, ButtonStyle, ButtonBuilder, ComponentType, inlineCode } = require('discord.js');
const { errorEmbed, infoEmbed, successEmbed } = require('../../../lib/embed');

module.exports = {
    name: "volume",
    description: "set volume",
    cooldown: 1,
    category: "lofi",
    async execute(message, args) {
        let isplaying = await message.client.db.has(`vc.${message.guild.id}.now`);
        if(!isplaying) return message.replyWithoutMention({ embeds: [errorEmbed('The bot is not playing music right now.')] });

        let getdb = await message.client.db.get(`vc.${message.guild.id}`);
        if(getdb.master !== message.member.user.id) return message.replyWithoutMention({ embeds: [errorEmbed('Only the DJ can control using this command.')] })
        if(getdb.channel !== message.member.voice.channelId) return message.replyWithoutMention({ embeds: [errorEmbed(`We are not in the same voice channel!`)] });
        
        let player = getVoiceConnection(message.guild.id).state.subscription.player;

        if(!args[0]) {
            let btns = {
                20:  new ButtonBuilder().setCustomId('20').setLabel('20%').setStyle(ButtonStyle.Secondary),
                40:  new ButtonBuilder().setCustomId('40').setLabel('40%').setStyle(ButtonStyle.Secondary),
                60:  new ButtonBuilder().setCustomId('60').setLabel('60%').setStyle(ButtonStyle.Secondary),
                80:  new ButtonBuilder().setCustomId('80').setLabel('80%').setStyle(ButtonStyle.Secondary),
                100:  new ButtonBuilder().setCustomId('100').setLabel('100%').setStyle(ButtonStyle.Primary),
            }
    
            let volumeRow = new ActionRowBuilder().addComponents(btns['20'], btns['40'], btns['60'], btns['80'], btns['100']);
    
            let msg = await message.channel.send({ embeds: [infoEmbed(`Current volume: ${inlineCode(`${player.state.resource.volume.volume * 100}%`)}`)], components: [volumeRow]});
            const collector = message.channel.createMessageComponentCollector({ componentType: ComponentType.Button, time: 120000 });
            collector.on('collect', async(d) => {
                const set = async(x) => {
                    await player.state.resource.volume.setVolume(Number(x.customId) / 100);
                    Object.keys(btns).map((x) => {
                        btns[x].setStyle(ButtonStyle.Secondary)
                    })

                    btns[x.customId].setStyle(ButtonStyle.Primary);
                    msg.edit({ embeds: [infoEmbed(`Current volume: ${inlineCode(`${player.state.resource.volume.volume * 100}%`)}`)], components: [volumeRow] })
                }
    
                await d.deferUpdate();
                set(d)
            });

            return;
        } else {
            if(args[0] > 100) args[0] = 100;
            await player.state.resource.volume.setVolume(args[0] / 100);
            message.replyWithoutMention({ embeds: [successEmbed(`Successfully set the volume to ${inlineCode(args[0] + '%')}`)]})
            return;
        }
    }
}