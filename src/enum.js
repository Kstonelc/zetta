export class ColorScheme {
  static {
    this.light = "light";
    this.dark = "dark";

    this.text = {};
    this.text[this.light] = "浅色模式";
    this.text[this.dark] = "深色模式";
  }
}

export class HttpStatus {
  static {
    this.Ok = 200;
    this.Unauthorized = 401;
    this.Forbidden = 403;
    this.NotFound = 404;
    this.UnprocessableEntity = 422;
    this.InternalServerError = 500;

    this.text = {};
    this.text[this.Ok] = "成功";
    this.text[this.Unauthorized] = "未授权";
    this.text[this.Forbidden] = "禁止访问";
    this.text[this.NotFound] = "未找到";
    this.text[this.UnprocessableEntity] = "请求格式错误";
    this.text[this.InternalServerError] = "服务器内部错误";
  }
}

export class ModelProviderUpdateType {
  static {
    this.Update = "update";
    this.Clear = "clear";

    this.text = {};
    this.text[this.Update] = "更新";
    this.text[this.Clear] = "清空";
  }
}

export class ModelType {
  static {
    this.TextEmbedding = "TextEmbedding";
    this.TextGeneration = "TextGeneration";
    this.ReRank = "ReRank";

    this.text = {};
    this.text[this.TextEmbedding] = "文本向量";
    this.text[this.TextGeneration] = "文本生成";
    this.text[this.ReRank] = "重排序";
  }
}

export class WikiDataType {
  static {
    this.Structured = 1 << 0;
    this.Unstructured = 1 << 1;

    this.text = {};
    this.text[this.Structured] = "结构化";
    this.text[this.Unstructured] = "非结构化";
  }
}

export class UserRole {
  static {
    // 枚举值
    this.Admin = "admin";
    this.Editor = "editor";
    this.Visitor = "visitor";
    // 文本
    this.text = {};
    this.text[this.Admin] = "管理员";
    this.text[this.Editor] = "编辑";
    this.text[this.Visitor] = "访客";
  }

  static getOptions() {
    return [
      {
        value: this.Admin,
        label: this.text[this.Admin],
      },
      {
        value: this.Editor,
        label: this.text[this.Editor],
      },
      {
        value: this.Visitor,
        label: this.text[this.Visitor],
      },
    ];
  }
}
