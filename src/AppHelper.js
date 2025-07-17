import axios from "axios";
import { HttpStatus } from "@/enum";
import config from "../app.json";

class AppHelper {
  config;

  //region 初始化
  constructor() {
    this.config = config;
  }
  //endregion

  //region WebApi

  async apiPost(url, data) {
    try {
      if (!data) {
        data = {};
      }
      const apiUrl = url.startsWith("http")
        ? url
        : this.combineUrls(this.config.apiUrl, url);
      const axiosResponse = await axios.post(apiUrl, data);
      return axiosResponse.status === HttpStatus.OK
        ? axiosResponse.data // {ok, data?, message?}
        : { ok: false, message: axiosResponse.statusText };
    } catch (e) {
      if (e.code === "ERR_NETWORK") {
        return { ok: false, message: "_timeoutError" };
      }
      if (e.response.status === HttpStatus.Unauthorized) {
        return { ok: false, message: "_authenticationError" };
      }
      if (e.response.status === HttpStatus.UnprocessableEntity) {
        return { ok: false, message: "参数校验错误" };
      }
      return { ok: false, message: e.message };
    }
  }

  //endregion

  //region 通用功能
  getLength(value) {
    if (!value) {
      return 0;
    }
    if (this.isObject(value)) {
      return Object.keys(value).length;
    }
    return value.length;
  }

  isUndefined(value) {
    return typeof value === "undefined";
  }

  isNull(value) {
    return value === null;
  }

  isObject(value) {
    return !this.isNull(value) && typeof value === "object";
  }

  isString(value) {
    return typeof value === "string";
  }

  isArray(value) {
    return Array.isArray(value);
  }

  isFunction(value) {
    return typeof value === "function";
  }

  isInteger(value) {
    return Number.isInteger(value);
  }

  isNumber(value) {
    return !this.isNull(value) && !isNaN(value);
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  //endregion

  //region 格式转换

  trimStart(text, pattern = " ") {
    const regExp = new RegExp(`^${pattern}+`);
    return text.replace(regExp, "");
  }

  trimEnd(text, pattern = " ") {
    const regExp = new RegExp(`${pattern}+$`);
    return text.replace(regExp, "");
  }

  trim(text, pattern = " ") {
    return this.trimStart(text, pattern).trimEnd(text, pattern);
  }

  combinePaths(...parts) {
    return parts
      .filter(Boolean)
      .map((p) => p.replace(/^\/+|\/+$/g, ""))
      .join("/");
  }

  combineUrls(...urls) {
    if (!this.isArray(urls) || urls.length <= 0) {
      return "";
    }
    let url = urls[0];
    if (urls.length > 1) {
      for (let i = 1; i < urls.length; i++) {
        const path = urls[i];
        if (path) {
          url = `${this.trimEnd(url, "/")}/${this.trimStart(path, "/")}`;
        }
      }
    }
    return url;
  }

  //endregion
}

export default new AppHelper();
