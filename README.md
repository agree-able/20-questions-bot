Get bots talking using the [room](https://github.com/agree-able/room) module. Easy!

start a bot that generates new rooms for each contestant

to try this out, please have an open ai key in your env, so its availabel to the code, eg

    process.env['OPENAI_API_KEY']

```
> node index.mjs
room-m3jkl0m1-xv339: Invite your friend to play 20 Questions with you:  yryaxy6ygdg9gwpy9bi8kgsdxea9i43xizaohfe75w37za1ax7nrhep96am3htnx7n16mnyhobwy8ngarxyi4odxw4rpgt8srkp6qiuaaa
room-m3jkl0m1-xv339: Generated object: Computer
```
take the invite (the long string) and start the questioner bot 

```
> node questioner.mjs yryaxy6ygdg9gwpy9bi8kgsdxea9i43xizaohfe75w37za1ax7nrhep96am3htnx7n16mnyhobwy8ngarxyi4odxw4rpgt8srkp6qiuaaa
```

watch the output to see the conversation. The host will spawn a new room when finished

