import nfc

def on_connect(tag):
    print("Tag UID:", tag.identifier.hex())
    return True

with nfc.ContactlessFrontend('usb') as clf:
    clf.connect(rdwr={'on-connect': on_connect})
