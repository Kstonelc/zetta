export enum ColorScheme {
  light = "light",
  dark = "dark",
}

export enum HttpStatus {
  OK = 200,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  UnprocessableEntity = 422,
  InternalServerError = 500,
}

export enum ModelProviderUpdateType {
  Update = "update",
  Clear = "clear",
}

export enum ModelType {
  TextEmbedding = "TextEmbedding",
  TextGeneration = "TextGeneration",
  ReRank = "ReRank",
}

export enum WikiDataType {
  Structured = 1 << 0,
  Unstructured = 1 << 1,
}
