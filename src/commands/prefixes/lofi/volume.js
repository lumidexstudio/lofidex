const { AudioPlayerStatus, getVoiceConnection } = require('@discordjs/voice');
const { ActionRowBuilder, ButtonStyle, ButtonBuilder, ComponentType } = require('discord.js');

module.exports = {
    name: "volume",
    description: "set volume",
    cooldown: 1,
    category: "lofi",
    async execute(message, args) {
        if(!message.client.voice.adapters.has(message.guild.id)) return message.reply(`bot not in vc`);

        let getdb = await message.client.db.get(`vc.${message.guild.id}`);
        if(getdb.master !== message.member.user.id) return message.reply(`you are not the user that using the play command previously`)
        if(getdb.channel !== message.member.voice.channelId) return message.reply(`we are not in the same vc`);
        
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
    
            let msg = await message.channel.send({ content: "no args provided, you can use the buttons bellow. Now: " + player.state.resource.volume.volume * 100 + "%", components: [volumeRow]});
            const collector = message.channel.createMessageComponentCollector({ componentType: ComponentType.Button, time: 120000 });
            collector.on('collect', async(d) => {
                const set = async(x) => {
                    await player.state.resource.volume.setVolume(Number(x.customId) / 100);
                    Object.keys(btns).map((x) => {
                        btns[x].setStyle(ButtonStyle.Secondary)
                    })

                    btns[x.customId].setStyle(ButtonStyle.Primary);
                    msg.edit({ content: "no args provided, you can use the buttons bellow. Now: " + player.state.resource.volume.volume * 100 + "%", components: [volumeRow] })
                    const collector2 = message.channel.createMessageComponentCollector({ time: 120000 });
                    collector2.on('collect', async(i) => {
                        set(i)
                    });
                }
    
                await d.deferUpdate();
                set(d)
            });

            return;
        } else {
            if(args[0] > 100) args[0] = 100;
            await player.state.resource.volume.setVolume(args[0] / 100);
            message.reply("set volume to " + args[0])
            return;
        }
    }
}