import { Button, Text, View } from "@tarojs/components";
import { connect, Provider } from "@tarojs/redux";
import Taro, { Component, Config } from "@tarojs/taro";
import { AtFab, AtList, AtSearchBar, AtTabBar, AtSwipeAction, AtListItem, AtSegmentedControl } from "taro-ui";
import Banci from "../../classes/banci";
import info from "../../classes/info";
import Schedule from "../../classes/schedule";
import User from "../../classes/user";
import newinfo from "../../classes/newinfo";
import { updateBanci } from "../../redux/actions/banci";
import { updateInfo } from "../../redux/actions/info";
import { updateSchedule, deleteSchedule } from "../../redux/actions/schedule";
import { updatenewInfo } from "../../redux/actions/newinfo";
import { setUserData } from "../../redux/actions/user";
import store from "../../redux/store";
import { AppState } from "../../redux/types";
import { getPerscheResult, loginResult, postUserInfoResult, deletescheResult } from "../../types";
import getDateString from "../../utils/getDateString";
import "./index.scss";
import getAttendersNumber from "../../utils/getAttendersNumber";

/** 定义这个页面的 Props 和 States */
type Props = {
    user: User;
    schedules: Array<Schedule>;
    bancis: Array<Banci>;
    infos: Array<info>;
    newinfo: Array<info>;
    setUserData: (user: User) => void;
    updateSchedule: (Schedule: Schedule) => void;
    deleteSchedule: (id: string) => void;
    updateBanci: (banci: Banci) => void;
    updateInfo: (info: info) => void;
    updatenewInfo: (newinfo: newinfo) => void;
};

type States = {
    current: number;
    tabcurrent: number;
    searchvalue: string;
    openunfinished: boolean;
    openfinished: boolean;
    openfailed: boolean;
    openunset: boolean;
    // true 代表程序还在尝试登入，不要急着显示授权按钮
    notLoaded: boolean;

    skip_register: boolean;
};

/** 把需要的 State 和 Action 从 Redux 注入 Props */
function mapStateToProps(state: AppState) {
    return {
        user: state.user,
        schedules: state.schedules,
        bancis: state.bancis,
        infos: state.infos,
        newinfo: state.newinfos
    };
}

function mapDispatchToProps(dispatch: typeof store.dispatch) {
    return {
        setUserData: (user: User) => {
            dispatch(setUserData(user));
        },
        updateSchedule: (schedule: Schedule) => {
            dispatch(updateSchedule(schedule));
        },
        updateInfo: (info: info) => {
            dispatch(updateInfo(info));
        },
        updateBanci: (banci: Banci) => {
            dispatch(updateBanci(banci));
        },
        updatenewInfo: (newinfo: newinfo) => {
            dispatch(updatenewInfo(newinfo));
        },
        deleteSchedule: (id: string) => {
            dispatch(deleteSchedule(id));
        }
    };
}

/** 首页 */
class Index extends Component<Props, States> {
    config: Config = {
        navigationBarTitleText: "排了个班"
    };

    componentDidMount() {
        Taro.cloud.init();
        Taro.cloud
            .callFunction({
                name: "login"
            })
            .then(res => {
                var resdata = (res as unknown) as loginResult;

                if (resdata.result.code === 200) {
                    this.props.setUserData(new User(resdata.result.user));
                    Taro.cloud
                        .callFunction({
                            name: "getPersche"
                        })
                        .then(res => {
                            var resdata = (res as unknown) as getPerscheResult;
                            if (resdata.result.code === 200) {
                                resdata.result.schedules.map(sche => {
                                    this.props.updateSchedule(sche);
                                });
                                resdata.result.infos.map(info => {
                                    this.props.updateInfo(info);
                                });
                                resdata.result.newinfos.map(newinfo => {
                                    this.props.updatenewInfo(newinfo);
                                });
                                resdata.result.bancis.map(banci => {
                                    this.props.updateBanci(banci);
                                });
                                this.setState({ notLoaded: false });
                            }
                        });
                } else this.setState({ notLoaded: false });
            });
    }

    getUserInfo(e: any) {
        Taro.cloud.init();
        const { detail } = e;
        Taro.cloud
            .callFunction({
                name: "postUserInfo",
                data: {
                    name: detail.userInfo.nickName,
                    avatarUrl: detail.userInfo.avatarUrl,
                    gender: detail.userInfo.gender
                }
            })
            .then(res => {
                var resdata = (res as unknown) as postUserInfoResult;
                Taro.showToast({ title: "登入成功", icon: "success", duration: 2000 });
                this.props.setUserData(new User(resdata.result.data));
            });
    }

    createsche = () => {
        if (this.state.skip_register) this.setState({ skip_register: false });
        else
            Taro.navigateTo({
                url: "../createSchedule/createSchedule"
            });
    };

    deletesche(scheid: string, ownerid: string, userid: string) {
        Taro.showToast({ title: "移除中", icon: "loading", duration: 5000 });
        if (ownerid === userid) {
            Taro.cloud
                .callFunction({
                    name: "deletesche",
                    data: {
                        scheid: scheid
                    }
                })
                .then(res => {
                    const resdata = (res as unknown) as deletescheResult;
                    if (resdata.result.code === 200) {
                        this.props.deleteSchedule(scheid);
                        Taro.showToast({ title: "移除成功", icon: "success", duration: 2000 });
                    } else {
                        Taro.showToast({ title: "移除失败", icon: "none", duration: 2000 });
                    }
                });
        } else {
            Taro.showToast({ title: "您无权限删除该班表噢", icon: "none", duration: 2000 });
        }
    }
    handlebarClick(value: number) {
        this.setState({
            tabcurrent: value
        });
        if (value == 1) {
            Taro.redirectTo({
                url: "../Individual/individual"
            });
        }
    }

    constructor() {
        super(...arguments);
        this.state = {
            current: 0,
            tabcurrent: 0,
            searchvalue: "",
            openunfinished: true,
            openfinished: true,
            openfailed: true,
            openunset: true,
            notLoaded: true,
            skip_register: false
        };
    }

    render() {
        /** 还在登入 */
        if (this.state.notLoaded) {
            return (
                <View style={{ textAlign: "center", padding: "36px" }}>
                    <Text>努力加载中 ...</Text>
                </View>
            );
        }

        /** 尚未授权 */
        if (this.props.user._id === "" && !this.state.notLoaded && !this.state.skip_register) {
            return (
                <View style={{ textAlign: "center", padding: "36px" }}>
                    <Text>请先登入才能使用小程序的完整功能哦！</Text>
                    <Button style={{ marginTop: "60px" }} openType="getUserInfo" onGetUserInfo={this.getUserInfo}>
                        透过微信授权登入
                    </Button>
                    <Button style={{ marginTop: "24px" }} onClick={() => this.setState({ skip_register: true })}>
                        暂不登入，进去晃晃
                    </Button>
                </View>
            );
        }

        var sches = this.props.schedules.filter(sc => {
            if (this.state.current === 0) return sc.ownerID === this.props.user._id;
            else return sc.ownerID !== this.props.user._id && sc.attenders.includes(this.props.user._id);
        });

        var sche_group1 = sches
            .filter(sc => !sc.complete)
            .filter(sc => (this.state.searchvalue === "" ? true : sc.title.includes(this.state.searchvalue)));

        var sche_group2 = sches
            .filter(sc => sc.complete)
            .filter(sc => sc.endact.getTime() > new Date().getTime())
            .filter(sc => (this.state.searchvalue === "" ? true : sc.title.includes(this.state.searchvalue)));

        var sche_group3 = sches
            .filter(sc => sc.complete)
            .filter(sc => sc.endact.getTime() < new Date().getTime())
            .filter(sc => (this.state.searchvalue === "" ? true : sc.title.includes(this.state.searchvalue)));

        return (
            <Provider store={store}>
                <View style={{ backgroundColor: "white", textAlign: "center", paddingTop: "16px", paddingBottom: "12px" }}>
                    <AtSegmentedControl
                        customStyle={{ width: "95%" }}
                        values={["我管理的班表", "我报名的班表"]}
                        onClick={v => this.setState({ current: v })}
                        current={this.state.current}
                    />
                </View>

                <AtSearchBar value={this.state.searchvalue} onChange={value => this.setState({ searchvalue: value })} />

                <View style={{ marginTop: "16px" }}>
                    <Text className="form-lable" style={{ margin: "16px", lineHeight: "48px" }}>
                        报名中的班表
                    </Text>

                    <AtList hasBorder={false} customStyle={{ marginTop: "16px" }}>
                        {sche_group1.map(item => {
                            let start = getDateString(item.startact, true);
                            let end = getDateString(item.endact, true);
                            let userid = this.props.user._id;
                            var nums = getAttendersNumber(item._id);

                            return (
                                <AtSwipeAction
                                    key={item._id}
                                    onClick={this.deletesche.bind(this, item._id, item.ownerID, userid)}
                                    options={[
                                        {
                                            text: "删除",
                                            style: {
                                                backgroundColor: "#79a8a9"
                                            }
                                        }
                                    ]}
                                >
                                    <AtListItem
                                        note={start + " 到 " + end}
                                        title={item.title}
                                        extraText={"报名状态 " + nums.joined_num + "/" + nums.need_num}
                                        onClick={() => {
                                            Taro.navigateTo({
                                                url: "../joinSchedule/joinSchedule?_id=" + item._id
                                            });
                                        }}
                                    />
                                </AtSwipeAction>
                            );
                        })}
                    </AtList>
                    {sche_group1.length === 0 ? (
                        <Text style={{ opacity: 0.5, lineHeight: "18px", margin: "16px" }}>这个类别还没有班表!</Text>
                    ) : (
                        <Text />
                    )}
                </View>
                <View style={{ marginTop: "16px" }}>
                    <Text className="form-lable" style={{ margin: "16px", lineHeight: "48px" }}>
                        进行中的班表
                    </Text>
                    <AtList hasBorder={false}>
                        {sche_group2.map(item => {
                            let start = getDateString(item.startact, true);
                            let end = getDateString(item.endact, true);
                            let userid = this.props.user._id;
                            var nums = getAttendersNumber(item._id);
                            return (
                                <AtSwipeAction
                                    key={item._id}
                                    onClick={this.deletesche.bind(this, item._id, item.ownerID, userid)}
                                    options={[
                                        {
                                            text: "删除",
                                            style: {
                                                backgroundColor: "#79a8a9"
                                            }
                                        }
                                    ]}
                                >
                                    <AtListItem
                                        note={start + " 到 " + end}
                                        title={item.title}
                                        extraText={"参与情况 " + nums.joined_num + "/" + nums.need_num}
                                        onClick={() => {
                                            Taro.navigateTo({
                                                url: "../scheduleDetail/scheduleDetail?_id=" + item._id
                                            });
                                        }}
                                    />
                                </AtSwipeAction>
                            );
                        })}
                    </AtList>
                    {sche_group2.length === 0 ? (
                        <Text style={{ opacity: 0.5, lineHeight: "18px", margin: "16px" }}>这个类别还没有班表!</Text>
                    ) : (
                        <Text />
                    )}
                </View>
                <View style={{ marginTop: "16px" }}>
                    <Text className="form-lable" style={{ margin: "16px", lineHeight: "48px" }}>
                        已结束的班表
                    </Text>
                    <AtList hasBorder={false}>
                        {sche_group3.map(item => {
                            let start = getDateString(item.startact, true);
                            let end = getDateString(item.endact, true);
                            let userid = this.props.user._id;
                            return (
                                <AtSwipeAction
                                    key={item._id}
                                    onClick={this.deletesche.bind(this, item._id, item.ownerID, userid)}
                                    options={[
                                        {
                                            text: "删除",
                                            style: {
                                                backgroundColor: "#79a8a9"
                                            }
                                        }
                                    ]}
                                >
                                    <AtListItem
                                        note={start + " 到 " + end}
                                        title={item.title}
                                        onClick={() => {
                                            Taro.navigateTo({
                                                url: "../scheduleDetail/scheduleDetail?_id=" + item._id
                                            });
                                        }}
                                    />
                                </AtSwipeAction>
                            );
                        })}
                    </AtList>
                    {sche_group3.length === 0 ? (
                        <Text style={{ opacity: 0.5, lineHeight: "18px", margin: "16px" }}>这个类别还没有班表!</Text>
                    ) : (
                        <Text />
                    )}
                </View>
                <AtTabBar
                    fixed
                    tabList={[
                        { iconPrefixClass: "icon", iconType: "category", title: "" },
                        { iconPrefixClass: "icon", iconType: "usercenter", title: "" }
                    ]}
                    onClick={this.handlebarClick.bind(this)}
                    current={this.state.tabcurrent}
                ></AtTabBar>
                <View className="post-button">
                    <AtFab onClick={this.createsche}>
                        <Text className="at-fab__icon at-icon at-icon-add"></Text>
                    </AtFab>
                </View>
            </Provider>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Index);
