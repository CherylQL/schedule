import { BanciActions } from "../actions/banci";
import { UPDATE_BANCI, DELETE_BANCI } from "../constants/banci";
import Banci from "src/classes/banci";

/** 已经从数据库下载的 banci 数据 */
export default function bancis(state: Array<Banci> = [], action: BanciActions) {
    switch (action.type) {
        case UPDATE_BANCI:
            action.data.startTime = new Date(action.data.startTime);
            action.data.endTime = new Date(action.data.endTime);
            return [...state.filter(banci => banci._id !== action.data._id), action.data];
        case DELETE_BANCI:
            return [...state.filter(banci => banci._id !== action.data)];
        default:
            return state;
    }
}
