from TikTokLive import TikTokLiveClient
from TikTokLive.types.events import CommentEvent, ConnectEvent, GiftEvent, DisconnectEvent
from collections import deque
from datetime import datetime, timedelta
from gtts import gTTS
from pygame import mixer
import time
import random
import os

usuario = input("Introduce el nombre de usuario: ")

client: TikTokLiveClient = TikTokLiveClient(usuario)

# Crear una lista de comentarios y regalos recibidos
comments_list = []
unique_comments_list: deque = deque(maxlen=900)  # Lista de comentarios únicos

# Filtro de tiempo entre comentarios (en segundos)
tiempo_entre_comentarios = 1

@client.on("connect")
async def on_connect(_: ConnectEvent):
    print("Conectado a la sala ID:", client.room_id)

@client.on("comment")
async def on_tiktok_comment(event: CommentEvent):
    comment = f"{event.comment}"

    if not comment.startswith("/") and not comment.startswith(".") and not any(char in comment for char in "*_-+=;:,?()[]{}<>\\/|#@\"'`^&%$"):
        # Filtro de tiempo de espera entre comentarios
        current_time = datetime.now()
        if unique_comments_list and (current_time - unique_comments_list[-1][1]).total_seconds() < tiempo_entre_comentarios:
            # El comentario se envió demasiado rápido, no pasa el filtro
            print(f"Comentario enviado demasiado rápido: {comment}")
            return

        # Filtro de comentarios duplicados
        if comment in [c[0] for c in unique_comments_list]:
            # El comentario es un duplicado, no pasa el filtro
            print(f"Comentario duplicado eliminado: {comment}")
            return

        unique_comments_list.append((comment, current_time))
        comments_list.append(comment)

        if comment.startswith("!") and len(comment) >= 2:
            username = ""
        else:
            username = f" de {event.user.nickname} "
        comments_list.append(comment)
        print(comment)

        # Reproducir el comentario en voz alta
        hablar(comment)

@client.on("gift")
async def on_gift(event: GiftEvent):
    message = f"{event.gift.info.name}"
    print(f"{event.gift.info.name}")
    giftuser = f" de {event.user.unique_id}"
    comments_list.append(message)

@client.on("disconnect")
async def on_disconnect(event: DisconnectEvent):
    print("Reconectando...")

def hablar(mensaje):
    # Usar libreria gTTS
    volume = 0.7
    tts = gTTS(mensaje, lang="es", slow=False)
    ran = random.randint(0,9999)
    filename = 'Temp' + format(ran) + '.mp3'
    tts.save(filename)
    mixer.init()
    mixer.music.load(filename)
    mixer.music.set_volume(volume)
    mixer.music.play()

    while mixer.music.get_busy():
        time.sleep(0.3)

    mixer.quit()
    os.remove(filename)

if __name__ == '__main__':
    client.run()
