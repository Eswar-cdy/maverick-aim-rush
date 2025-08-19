import json
from channels.generic.websocket import AsyncWebsocketConsumer

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]

        if not self.user.is_authenticated:
            await self.close()
        else:
            # Each user joins a group named after their own user ID.
            # This creates a private "channel" to send notifications directly to them.
            self.room_group_name = f"user_{self.user.id}"

            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    # This method is called when we want to send a message TO the frontend
    async def send_notification(self, event):
        message = event["message"]
        await self.send(text_data=json.dumps({
            "type": "notification",
            "message": message,
        }))
