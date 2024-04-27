import config from 'config'
import { Client, DiscordAPIError, Message } from 'discord.js'
import { setTimeout } from 'node:timers/promises'

const client = new Client({
  intents: [
    'Guilds',
    'GuildMessages',
    'GuildMessageReactions',
    'MessageContent',
  ],
})

export function getClient() {
  return client
}

client.on('ready', () => {
  console.log(`ready: ${client.user?.tag}`)
})

/**
 * greetingチャンネル投稿時にJavajaotanが動作していなければメッセージを削除
 *
 * @param message メッセージ
 */
async function greetingCheck(message: Message): Promise<void> {
  // 5秒待ってから
  await setTimeout(5000)

  if (message.content !== 'jao' && message.content !== 'afa') {
    try {
      await message.delete()
    } catch (error) {
      if (!(error instanceof DiscordAPIError)) {
        throw error
      }
      return
    }
    const reply = await message.channel.send(
      '<@' + message.author.id + '>, SERVICE UNAVAILABLE',
    )
    await setTimeout(10_000)
    await reply.delete()
    return
  }
  await setTimeout(5000)

  const newMessage = await message.channel.messages.fetch(message.id)
  if (newMessage.reactions.cache.filter((r) => r.me).size > 0) {
    return
  }

  await message.react('⚒')
  const reply = await message.reply(
    '現在、自動権限付与システムが停止しています。しばらく経ってからもう一度お試しください。(このメッセージは10秒後に削除されます)',
  )
  await setTimeout(10_000)
  await reply.delete()
}

/**
 * nsfwチャンネルへの画像送信時、スポイラーでなければ削除
 *
 * @param message メッセージ
 */
async function nsfwCheck(message: Message): Promise<void> {
  // 3秒待ってから
  await setTimeout(3000)

  if (message.attachments.size === 0) {
    return
  }

  for (const attachment of message.attachments.values()) {
    if (attachment.name.startsWith('SPOILER_')) {
      continue
    }
    try {
      await message.delete()
    } catch (error) {
      if (!(error instanceof DiscordAPIError)) {
        throw error
      }
      continue
    }
    await message.channel.send(
      '<@' +
        message.author.id +
        '>,スポイラーの設定がされていないファイルは投稿できません。',
    )
  }
}

client.on('messageCreate', async (message: Message) => {
  if (message.author.id === client.user?.id) return
  if (message.channel.id === '603841992404893707') {
    await greetingCheck(message)
  }

  if (
    message.channel.id === '597768445601382400' &&
    message.attachments.size > 0
  ) {
    await nsfwCheck(message)
  }
})

client
  .login(config.get('discordToken'))
  .then(() => {
    console.log('Login Successful.')
  })
  .catch((error: unknown) => {
    console.error('Login Failed.')
    console.error(error)
  })
