import axios from "axios";
 
const httpUrl = '/yun';
const request = axios.create({
  baseURL: httpUrl,
  timeout: 10000,
});
request.interceptors.request.use(
  (config) => {
    if (!config.headers['X-AKS-ClientId']) {
      config.headers["X-AKS-ClientId"] = "1621414464483155969";
    }
    if (!config.headers["X-AKS-ModuleId"]) {
      config.headers["X-AKS-ModuleId"] = "1639139129914560513";
    }
    return config;
  },
  (error) => {
    throw new Error(error);
  },
);

request.interceptors.response.use(
  (response) => {
    const { data } = response;
    // if (data.code !== 0) {
    //   throw new Error(data.msg);
    // }
    return data;
  },
  (error) => {
    const { status, data } = error.response;
    if (status !== 200) {
      throw new Error(data.message);
    }
  },
);
export default request;