export class ColorScheme {
  static light = "light";
  static dark = "dark";

  static text: Record<string, string> = {
    [this.light]: "浅色模式",
    [this.dark]: "深色模式",
  };
}

export class HttpStatus {
  static Ok = 200;
  static Unauthorized = 401;
  static Forbidden = 403;
  static NotFound = 404;
  static UnprocessableEntity = 422;
  static InternalServerError = 500;

  static text: Record<number, string> = {
    [this.Ok]: "成功",
    [this.Unauthorized]: "未授权",
    [this.Forbidden]: "禁止访问",
    [this.NotFound]: "未找到",
    [this.UnprocessableEntity]: "请求格式错误",
    [this.InternalServerError]: "服务器内部错误",
  };
}

export class ModelProviderUpdateType {
  static Update = "update";
  static Clear = "clear";

  static text: Record<string, string> = {
    [this.Update]: "更新",
    [this.Clear]: "清空",
  };
}

export class ModelType {
  static TextEmbedding = "textEmbedding";
  static TextGeneration = "textGeneration";
  static ReRank = "reRank";

  static text: Record<string, string> = {
    [this.TextEmbedding]: "文本向量",
    [this.TextGeneration]: "文本生成",
    [this.ReRank]: "重排序",
  };
}

export class WikiType {
  static Structured = 1 << 0;
  static Unstructured = 1 << 1;

  static text: Record<number, string> = {
    [this.Structured]: "结构化",
    [this.Unstructured]: "非结构化",
  };
}

export class UserStatus {
  static Active = "active";
  static Pending = "pending";
  static Banned = "banned";

  static text: Record<string, string> = {
    [this.Active]: "正常",
    [this.Pending]: "待接受",
    [this.Banned]: "禁用",
  };
}

export class UserRole {
  static Owner = "owner";
  static Admin = "admin";
  static Editor = "editor";
  static Visitor = "visitor";

  static text: Record<string, string> = {
    [this.Owner]: "所有者",
    [this.Admin]: "管理员",
    [this.Editor]: "编辑",
    [this.Visitor]: "查看",
  };

  static desc: Record<string, string> = {
    [this.Owner]: "所有功能",
    [this.Admin]: "管理所有功能",
    [this.Editor]: "编辑功能",
    [this.Visitor]: "查看使用",
  };

  static getOptions(): Array<{
    value: string;
    label: string;
    desc: string;
  }> {
    return [
      {
        value: this.Admin,
        label: this.text[this.Admin],
        desc: this.desc[this.Admin],
      },
      {
        value: this.Editor,
        label: this.text[this.Editor],
        desc: this.desc[this.Editor],
      },
      {
        value: this.Visitor,
        label: this.text[this.Visitor],
        desc: this.desc[this.Visitor],
      },
    ];
  }
}

export class FileType {
  static Txt = 1 << 0;
  static Md = 1 << 1;
  static Doc = 1 << 2;
  static Pdf = 1 << 3;

  static text: Record<number, string> = {
    [this.Txt]: "Txt",
    [this.Md]: "MarkDown",
    [this.Doc]: "Doc",
    [this.Pdf]: "Pdf",
  };

  static suffix: Record<number, string[]> = {
    [this.Txt]: [".txt"],
    [this.Md]: [".md"],
    [this.Doc]: [".doc", ".docx"],
    [this.Pdf]: [".pdf"],
  };

  static icon: Record<number, string> = {
    [this.Txt]: "/txt.png",
    [this.Md]: "/markdown.png",
    [this.Doc]: "/doc.png",
    [this.Pdf]: "/pdf.png",
  };

  static getFileType(fileExt: string): number | undefined {
    const ext = fileExt.toLowerCase();
    return Object.keys(this.suffix)
      .map(Number)
      .find((key) => this.suffix[key].includes(ext));
  }
}

export class ChunkMode {
  static Classic = 1 << 0;
  static FeatherSon = 1 << 1;

  static text: Record<number, string> = {
    [this.Classic]: "经典模式",
    [this.FeatherSon]: "父子模式",
  };
}

export class ConversationStatus {
  static Active = 1 << 0;
  static Archived = 1 << 1;
  static Temporary = 1 << 2;

  static text: Record<number, string> = {
    [this.Active]: "可用",
    [this.Archived]: "归档",
    [this.Temporary]: "临时",
  };
}

export class ConversationRole {
  static User = 1 << 0;
  static Assistant = 1 << 1;

  static text: Record<number, string> = {
    [this.User]: "用户",
    [this.Assistant]: "AI",
  };
}
