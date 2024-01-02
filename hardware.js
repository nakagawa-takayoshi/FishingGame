
class Motor
{
    constructor()
    {
      this._pulse = 0;
    }


    get pluse()
    {
        return this._x;
    }

    set pluse(value)
    {
        this._pluse = value;
    }

    clear()
    {
      this._pluse = 0;
    }


}

/**
 * @brief パッド制御のモデルクラス
 */
class PadControllerModel
{
    constructor(upDownModel, leftRightModel)
    {
        this.upDown = upDownModel;
        this.leftRight = leftRightModel;
    }
}

/**
 * @brief ロボットアームのモデルクラス
 */
class RobotArms
{
    constructor()
    {
        this.arm2 = new Motor();
        this.arm3 = new Motor();
        this.arm4 = new Motor();
        this.arm5 = new Motor();

        this.leftPadControlModel = new PadControllerModel(this.arm2, this.arm3);
        this.rightPadControlModel = new PadControllerModel(this.arm4, this.arm5);
    }

}


class RobotArmsController
{
    #_hardware;

    constructor(hardwere)
    {
        this.#_hardware = hardwere;
    }

    drive(pluseCount) {
        console.log("name=" + pluseCount.name + ", updown=" + pluseCount.upDown + ", leftRight=" + pluseCount.leftRight);
    }

}

