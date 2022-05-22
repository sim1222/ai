import autobind from 'autobind-decorator';
import Module from '@/module';
import Message from '@/message';
import config from '@/config';
import fetch from 'node-fetch';
import serifs from "@/serifs";


type mode = 'cool' | 'warm' | 'dry';
const tempList = [16, 16.5, 17, 17.5, 18, 18.5, 19, 19.5, 20, 20.5, 21, 21.5, 22, 22.5, 23, 23.5, 24, 24.5, 25, 25.5, 26, 26.5, 27, 27.5, 28, 28.5, 29, 29.5, 30]
type temp = [16, 16.5, 17, 17.5, 18, 18.5, 19, 19.5, 20, 20.5, 21, 21.5, 22, 22.5, 23, 23.5, 24, 24.5, 25, 25.5, 26, 26.5, 27, 27.5, 28, 28.5, 29, 29.5, 30]

let command: {
	device: String,
	state: Boolean,
	mode?: String,
	temp?: Number,
	error?: Boolean
}

const setLight = async (state: Boolean) => {

	const button = state ? 'on-100' : 'off';

	const res = await fetch(`https://api.nature.global/1/appliances/${config.natureLightId}/light`, {
		method: 'POST',
		headers: {
			authorization: `Bearer ${config.natureApiKey}`
		},
		body: JSON.stringify({
			button
		})
	});

	console.log(res);
	return await res.json();
};

const setAircon = async (state: Boolean, mode?: mode, temp?: number) => {

	const button = state ? '' : 'power-off';

	const res = await fetch(`https://api.nature.global/1/appliances/${config.natureLightId}/aircon_settings`, {
		method: 'POST',
		headers: {
			authorization: `Bearer ${config.natureApiKey}`
		},
		body: JSON.stringify({
			button,
			mode: mode,
			temp: temp
		})
	});
	const resJson = await res.json();
	console.log(resJson);
	switch (resJson.mode) {
		case 'cool':
			resJson.mode = '冷房';
			return resJson;
		case 'warm':
			resJson.mode = '暖房';
			return resJson;
		case 'dry':
			resJson.mode = '除湿';
			return resJson;
		default:
			resJson.mode = 'その他';
			return resJson;
	}
};


export default class extends Module {
	public readonly name = 'home-control';

	@autobind
	public install() {
		return {
			mentionHook: this.mentionHook
		};
	}


	@autobind
	public async mentionHook(msg: Message) {

		const onHook = msg.text.includes('オン') || msg.text.includes('つけて') || msg.text.includes('つけろ') || msg.text.includes('点けて') || msg.text.includes('点けろ');
		const offHook = msg.text.includes('オフ') || msg.text.includes('けして') || msg.text.includes('消して') || msg.text.includes('消せ') || msg.text.includes('けせ');
		const setHook = msg.text.includes('セット') || msg.text.includes('せっと') || msg.text.includes('にして');
		const timerHook = msg.text.includes('秒後に') || msg.text.includes('分後に') || msg.text.includes('時間後に');

		const secondsQuery = (msg.text || '').match(/([0-9]+)秒/);
		const minutesQuery = (msg.text || '').match(/([0-9]+)分/);
		const hoursQuery = (msg.text || '').match(/([0-9]+)時間/);

		const timer = secondsQuery || minutesQuery || hoursQuery;

		const seconds = secondsQuery ? parseInt(secondsQuery[1], 10) : 0;
		const minutes = minutesQuery ? parseInt(minutesQuery[1], 10) : 0;
		const hours = hoursQuery ? parseInt(hoursQuery[1], 10) : 0;

		const light = msg.text.includes('電気') || msg.text.includes('でんき') || msg.text.includes('照明') || msg.text.includes('ライト');
		const aircon = msg.text.includes('エアコン') || msg.text.includes('空調') || msg.text.includes('えあこん');

		const cool = msg.text.includes('冷房') || msg.text.includes('れいぼう') || msg.text.includes('つめた');
		const warm = msg.text.includes('暖房') || msg.text.includes('だんぼう') || msg.text.includes('あたたか');
		const dry = msg.text.includes('ドライ') || msg.text.includes('どらい') || msg.text.includes('除湿') || msg.text.includes('じょしつ');

		const tempQuery = (msg.text || '').match(/([0-9]+)[ど度℃]/);
		const temp = tempQuery ? parseInt(tempQuery[1], 10) : 0;



		const checkCommand = () => {
			if (light) {
				(onHook)? command = { device: 'ライト', state: true } : (offHook) ? command = { device: 'ライト', state: false } : command = { device: 'ライト', state: true, error: true };
			}
			if (aircon) {
				if (setHook) {
					if (cool) {
						if (tempList.includes(temp)) {
							command = { device: 'エアコン', state: true, mode: 'cool', temp: temp };
						} else {
							command = { device: 'エアコン', state: true, mode: 'cool', error: true };
						}
					} else if (warm) {
						if (tempList.includes(temp)) {
							command = { device: 'エアコン', state: true, mode: 'warm', temp: temp };
						} else {
							command = { device: 'エアコン', state: true, mode: 'warm', error: true };
						}
					} else if (dry) {
						if (tempList.includes(temp)) {
							command = { device: 'エアコン', state: true, mode: 'dry', temp: temp };
						} else {
							command = { device: 'エアコン', state: true, mode: 'dry', error: true };
						}
					}
				}
				(onHook) ? command = { device: 'エアコン', state: true } : (offHook) ? command = { device: 'エアコン', state: false } : command = { device: 'エアコン', state: true, error: true };
			}
			return command;
		}


		const commandExec = async (command) => {

			if (command.error) {
				return msg.reply(`エラーが発生しました。`);
			}
			switch (command.device) {
				case 'ライト':
					return await setLight(command.state);
				case 'エアコン':
					return await setAircon(command.state, command.mode, command.temp);
			}
		}




		//------------------------------------------------------

		//操作部分

		if (!(onHook || offHook || setHook)) return false;

		if (light) {
			if (onHook) {
				await setLight(true);
				return msg.reply('電気をつけました');
			} else if (offHook) {
				await setLight(false);
				return msg.reply('電気を消しました');
			}
		}

		if (aircon) {
			if (onHook) {
				const res = await setAircon(true);
				return msg.reply(`エアコンを${res.temp}℃の${res.mode}にしました`);
			} else if (offHook) {
				await setAircon(false);
				return msg.reply('エアコンを消しました');
			} else if (setHook) {
				if (cool) {
					if (tempList.includes(temp)) {
						const res = await setAircon(true, 'cool', temp);
						return msg.reply(`エアコンを${res.temp}℃の${res.mode}にしました`);
					} else {
						return msg.reply('エアコンの設定が正しくありません');
					}
				} else if (warm) {
					if (tempList.includes(temp)) {
						const res = await setAircon(true, 'warm', temp);
						return msg.reply(`エアコンを${res.temp}℃の${res.mode}にしました`);
					} else {
						return msg.reply('エアコンの設定が正しくありません');
					}
				} else if (dry) {
					if (tempList.includes(temp)) {
						const res = await setAircon(true, 'dry', temp);
						return msg.reply(`エアコンを${res.temp}℃の${res.mode}にしました`);
					} else {
						return msg.reply('エアコンの設定が正しくありません');
					}
				}
			}
		}

		//タイマー部分


		if (timerHook) {

			if ((seconds + minutes + hours) == 0) {
				msg.reply(serifs.timer.invalid);
				return true;
			}

			const time =
				(1000 * seconds) +
				(1000 * 60 * minutes) +
				(1000 * 60 * 60 * hours);

			if (time > 86400000) {
				msg.reply(serifs.timer.tooLong);
				return true;
			}

			if (checkCommand().error) {
				msg.reply('設定が正しくありません');
				return true;
			}

			msg.reply(serifs.timer.set);

			const str = `${hours ? hoursQuery![0] : ''}${minutes ? minutesQuery![0] : ''}${seconds ? secondsQuery![0] : ''}`;

			// タイマーセット
			this.setTimeoutWithPersistence(time, {
				isDm: msg.isDm,
				msgId: msg.id,
				userId: msg.friend.userId,
				command: checkCommand(),
			});

			return true;
		}
	}

	@autobind
	private timeoutCallback(data) {
		const friend = this.ai.lookupFriend(data.userId);
		if (friend == null) return; // 処理の流れ上、実際にnullになることは無さそうだけど一応

		const commandExec = async (command) => {
			if (command.error) {
				return this.ai.post({
					replyId: data.msgId,
					text: `エラーが発生しました。`
			});
			}
			switch (command.device) {
				case 'ライト':
					return await setLight(command.state);
				case 'エアコン':
					return await setAircon(command.state, command.mode, command.temp);
			}
		}


		const commandText = () => {
			if (data.command.device == '電気') {
				return data.command.state ? 'つけました' : '消しました';
			} else if (data.command.device == 'エアコン') {
				return data.command.state ? `${data.command.temp}℃の${data.command.mode}にしました` : '消しました';
			}
			return false;
		};

		const text = '${data.time}経ったので、${data.command.device}を${commandText()}しました';
		if (data.isDm) {
			commandExec(data.command);
			this.ai.sendMessage(friend.userId, {
				text: text
			});
		} else {
			commandExec(data.command);
			this.ai.post({
				replyId: data.msgId,
				text: text
			});
		}
	}
}
