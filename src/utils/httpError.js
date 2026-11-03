import { ObjectId } from "mongodb";

// http error
export const cs_httpError = (status, message) => {
  const cs_err = new Error(message);
  cs_err.status = status;
  return cs_err;
};

// id validator
export const cs_toObjectId = (id, label = "Item") => {
  if (!ObjectId.isValid(id)) throw cs_httpError(404, `${label} not found.`);
  return new ObjectId(id);
};
