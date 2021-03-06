import { View } from "@tarojs/components";
import Taro, { Component } from "@tarojs/taro";
import { AtListItem, AtList } from "taro-ui";
import info from "../classes/info";
import User from "../classes/User";
import Schedule from "../classes/Schedule";
import { deleteinfoResult } from "../types";

interface Props {
    user: User;
    infos: Array<info>;
    banciID: string;
    schedule: Schedule;
    deleteInfo: (id: string) => void;
    updateAttendersNumber: () => void;
}

export default class UserBadge extends Component<Props> {
    Delete(info_id: string, user_id: string) {
        Taro.showToast({ title: "移除中", icon: "loading", duration: 2000 });

        if (user_id === this.props.user._id || this.props.user._id === this.props.schedule.ownerID) {
            Taro.cloud
                .callFunction({
                    name: "deleteinfo",
                    data: {
                        infoid: info_id
                    }
                })
                .then(res => {
                    const resdata = (res as unknown) as deleteinfoResult;
                    if (resdata.result.code === 200) {
                        Taro.showToast({ title: "移除成功", icon: "success", duration: 2000 });
                    }
                    this.props.deleteInfo(info_id);
                    this.props.updateAttendersNumber();
                });
        } else {
            Taro.showToast({ title: "您无权限编辑他人的班次选择噢", icon: "none", duration: 2000 });
        }
    }

    render() {
        if (this.props.infos === undefined) return <View />;
        return this.props.infos ? (
            <AtList>
                {this.props.infos.map(x => {
                    if (x.classid === this.props.banciID)
                        return <AtListItem key={x._id} title={x.tag} onClick={this.Delete.bind(this, x._id, x.userid)} />;
                })}
            </AtList>
        ) : (
            <View />
        );
    }
}
