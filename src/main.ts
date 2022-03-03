import config from 'config'
import { Client, DiscordAPIError, Intents, Message } from 'discord.js'

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  ],
})

export function getClient() {
  return client
}

client.on('ready', async () => {
  console.log(`ready: ${client.user?.tag}`)
})

/**
 * greetingチャンネル投稿時にJavajaotanが動作していなければメッセージを削除
 *
 * @param message メッセージ
 */
async function greetingCheck(message: Message): Promise<void> {
  // 3秒待ってから
  await new Promise((resolve) => setTimeout(resolve, 5000))

  if (message.content !== 'jao' && message.content !== 'afa') {
    try {
      await message.delete()
    } catch (e) {
      if (!(e instanceof DiscordAPIError)) {
        throw e
      }
      return
    }
    await message.channel
      .send('<@' + message.author.id + '>, SERVICE UNAVAILABLE')
      .then((msg) => {
        setTimeout(() => msg.delete(), 10000)
      })
    return
  }

  const sleep = (msec: number) =>
    new Promise((resolve) => setTimeout(resolve, msec))
  sleep(10000)

  const newMessage = await message.channel.messages.fetch(message.id)
  if (newMessage.reactions.cache.filter((r) => r.me).size !== 0) {
    return
  }

  await message
    .reply(
      '現在、自動権限付与システムが停止しています。しばらく経ってからもう一度お試しください。(このメッセージは10秒後に削除されます)'
    )
    .then((msg) => {
      setTimeout(() => msg.delete(), 10000)
    })
  await message.react('⚒')
}

/**
 * nsfwチャンネルへの画像送信時、スポイラーでなければ削除
 *
 * @param message メッセージ
 */
async function nsfwCheck(message: Message): Promise<void> {
  // 3秒待ってから
  await new Promise((resolve) => setTimeout(resolve, 3000))

  if (message.attachments.size === 0) {
    return
  }

  message.attachments.forEach((attachment) => {
    if (attachment.name?.startsWith('SPOILER_')) {
      return
    }
    try {
      message.delete()
    } catch (e) {
      if (!(e instanceof DiscordAPIError)) {
        throw e
      }
      return
    }
    message.channel.send(
      '<@' +
        message.author.id +
        '>,スポイラーの設定がされていないファイルは投稿できません。'
    )
  })
}

client.on('messageCreate', async (message: Message) => {
  if (message.author.id === client.user?.id) return
  if (message.channel.id === '603841992404893707') {
    await greetingCheck(message)
  }

  if (
    message.channel.id === '597768445601382400' &&
    message.attachments.size !== 0
  ) {
    await nsfwCheck(message)
  }
})

client
  .login(config.get('discordToken'))
  .then(() => console.log('Login Successful.'))
