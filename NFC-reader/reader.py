import time
from smartcard.System import readers

def to_hex_string(byte_array):
    return ''.join(f'{b:02X}' for b in byte_array)

def main():
    rlist = readers()
    if not rlist:
        print("カードリーダが見つかりません。RC-S300が接続されているか確認してください。")
        return

    reader = rlist[0]
    print(f"接続中: {reader}")

    connection = reader.createConnection()
    connection.connect()

    command = [0xFF, 0xCA, 0x00, 0x00, 0x00]

    last_idm = None

    while True:
        try:
            response, sw1, sw2 = connection.transmit(command)
            if sw1 == 0x90 and sw2 == 0x00:
                idm = to_hex_string(response)
                if idm != last_idm:
                    print("読み取り成功 - IDm:", idm)
                    last_idm = idm
            else:
                print(f"読み取り失敗: sw1={sw1:02X}, sw2={sw2:02X}")
        except Exception as e:
            print("エラー:", e)
        time.sleep(0.5)

if __name__ == '__main__':
    main()
