import request from "../core/request";

const api="https://x.580u.com/yun"
const moduleId = "1639139129914560513";
const module = api+"/module";
const apiModuleSuffix = "/app";
const version = "v1";

const prefixUrl = module + "/" + moduleId + apiModuleSuffix + '/' + version;
export const translationPromptRequest = async (payload) => {
  const url = prefixUrl + "/tagManageInfo/translation";
  return await request.post(url, payload);
};

export const tagManageKeyWordList = async (payload) => {
  const url = prefixUrl + "/tagManageKeyword/list";
  return await request.post(url, payload);
};