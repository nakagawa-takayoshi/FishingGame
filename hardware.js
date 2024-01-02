/**
 * @file hardware.js
 * @brief ハードウェア関連の実装ファイル
 */

//------------------------------------------
/**
 * @brief ハードウェアモデルクラス
 */
class HardwareModel {
    constructor() {
        this.obniz = new Obniz("6453-5471", { access_token:"j6S9JqzEUQwLg5Q6WpVgDDabnHkwx4_pNTe3L2Fw2ZGSAAg5qqFG10_ugfd7geHN" })
    }

    onconnect = () => {
        this.obniz.onconnect = async function() {
            document.getElementById("t1").innerHTML = "";
            var driver = obniz.wired("PCA9685", {i2c:i2c, address:0x40  });
            driver.freq(60);    
          }
      }
    
}

//------------------------------------------
/**
 * @brief モーターのモデルクラス
 */
class Motor {
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

//------------------------------------------
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


/**
 * @brief ロボットアーム制御クラス
 */
class RobotArmsController
{
    #_hardware;

    constructor(hardwere)
    {
        this.#_hardware = hardwere;
    }

    drive(pulseCounts) {
        console.log("name=" + pulseCounts.name + ", updown=" + pulseCounts.upDown + ", leftRight=" + pulseCounts.leftRight);
    }

    arm2drive(pulseCounts) {

    }

}

