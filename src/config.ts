type Config = {
	host: string;
	i: string;
	master?: string;
	masterIds: Array<string>;
	wsUrl: string;
	apiUrl: string;
	keywordEnabled: boolean;
	reversiEnabled: boolean;
	notingEnabled: boolean;
	chartEnabled: boolean;
	serverMonitoring: boolean;
	mecab?: string;
	mecabDic?: string;
	memoryDir?: string;
	weatherlocation?: string;
	natureApiKey?: string;
	natureLightId?: string;
	natureAirconId?: string;
};

const config = require('../config.json');

config.wsUrl = config.host.replace('http', 'ws');
config.apiUrl = config.host + '/api';

export default config as Config;
