import axios from "axios";
import { HttpStatus } from "@/enum";
import React from "react";
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
      const accessToken = this.getAccessToken();
      const apiUrl = url.startsWith("http")
        ? url
        : this.combineUrls(this.config.apiUrl, url);
      if (data instanceof File) {
        const formData = new FormData();
        formData.append("file", data);
        data = formData;
      }
      const axiosResponse = await axios.post(apiUrl, data, {
        timeout: 5000,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return axiosResponse.status === HttpStatus.Ok
        ? axiosResponse.data // {ok, data?, message?}
        : { ok: false, message: axiosResponse.statusText };
    } catch (e) {
      if (e.code === "ERR_NETWORK") {
        return { ok: false, message: "请求错误" };
      }
      if (e.code === "ECONNABORTED") {
        return { ok: false, message: "请求超时" };
      }
      if (e.response.status === HttpStatus.Unauthorized) {
        return { ok: false, message: "登录信息过期, 请重新登录" };
      }
      if (e.response.status === HttpStatus.UnprocessableEntity) {
        return { ok: false, message: "参数校验错误" };
      }
      return { ok: false, message: e.message };
    }
  }

  async apiFetch(url, data) {
    const TIMEOUT_MS = 5000; // 5s 超时
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      if (!data) data = {};

      const accessToken = this.getAccessToken();
      const apiUrl = url.startsWith("http")
        ? url
        : this.combineUrls(this.config.apiUrl, url);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      if (!response.ok) {
        return { ok: false, message: response.statusText, response };
      }
      return { ok: true, response };
    } catch (e) {
      return {
        ok: false,
        message:
          e.name === "AbortError"
            ? "请求超时"
            : e.name === "TypeError"
              ? "网络错误或服务不可达"
              : e.message,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  //endregion

  //region LocalStorage 持久化数据
  getAccessToken() {
    return localStorage.getItem("access_token");
  }

  setAccessToken(accessToken) {
    localStorage.setItem("access_token", accessToken);
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

  isReactElement(element) {
    return React.isValidElement(element);
  }

  //endregion
}

export default new AppHelper();
