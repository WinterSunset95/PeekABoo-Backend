import { Server } from "https://deno.land/x/socket_io@0.1.1/mod.ts";
import { OpenRoom, ChatMessage, PeekABoo, RoomMessage, RoomRequest, User } from "./types.ts"

export const io = new Server({
    cors: {
        origin: "*"
    }
});

export const rooms: OpenRoom[] = []

export const checkIfRoomExists = (room: RoomRequest): OpenRoom | undefined => {
	for (let i=0; i<rooms.length; i++) {
		const curr = rooms[i]
		if (curr.RoomId.slice(0,-6) == room.RoomId.slice(0,-6)) {
			return curr
		}
	}
	return undefined
}

io.on("connection", (socket) => {
    console.log(`Socket ${socket.id} connected`)

    socket.broadcast.emit('new user', socket.id)

    socket.on("disconnect", (reason) => {
        console.log(`Socket: ${socket.id} disconnected due to ${reason}`)
        socket.broadcast.emit('user disconnected', socket.id)
		let found = false
		for (let i=0; i<rooms.length; i++) {
			const room = rooms[i]
			if (room.RoomId == socket.id) {
				rooms.splice(i,1)
				console.log(`Room ${room.RoomId} removed`)
				found = true
			} else if (room.UserId == socket.id) {
				rooms.splice(i,1)
				console.log(`Room ${room.RoomId} removed`)
				found = true
			} else {
				console.log(`User did not create a room`)
			}
		}
		if (!found) {
			console.log(`User did not create a room`)
		}
		socket.emit("getRooms", rooms)
    })

	socket.on("addUser", (user: User, callback: (usr: User) => void ) => {
		console.log(user)
		callback(user)
	})

    socket.on("addRoom", (room: OpenRoom, callback: (result: string) => void) => {
		console.log("Creating new room")
		console.log(room)
        const toReturn: PeekABoo<OpenRoom> = {
            peek: true,
            boo: room
        }
		const existingRoom = checkIfRoomExists({ RoomId: room.RoomId, RequesterId: room.UserId })
		if (existingRoom) {
			callback(`Similarly named room exists: ${existingRoom.RoomName}. Use a different name`)
		} else {
			rooms.push(room)
			socket.emit("newRoomAdded", toReturn)
			socket.broadcast.emit("newRoomAdded", toReturn)
			callback("ok")
		}
    })

	socket.on("getRooms", (user: User) => {
		io.to(user.UserId).emit("getRooms", rooms)
	})

	socket.on("joinRoom", (id: string) => {
		console.log(`Event joinRoom; Target: ${id} Client: ${socket.id}`)
		socket.join(id)
		const message: RoomMessage<ChatMessage> = {
			RoomId: id,
			SenderId: socket.id,
			Payload: {
				UserId: "notification",
				UserName: "System",
				UserImage: "https://api.dicebear.com/9.x/bottts/png",
				MessageType: "text",
				Message: `${socket.id} entered the room!`
			}
		}
		io.to(id).emit("chatMessage", message)
	})

	socket.on("leaveRoom", (id: string) => {
		socket.leave(id)
		const message: RoomMessage<ChatMessage> = {
			RoomId: id,
			SenderId: socket.id,
			Payload: {
				UserId: "notification",
				UserName: "System",
				UserImage: "https://api.dicebear.com/9.x/bottts/png",
				MessageType: "text",
				Message: `${socket.id} left the room!`
			}
		}
		io.to(id).emit("chatMessage", message)
	})

	socket.on("chatMessage", (message: RoomMessage<ChatMessage>) => {
		console.log(`Event chatMessage: ${message.RoomId}, ${message.Payload.Message}`)
		io.to(message.RoomId).emit("chatMessage", message)
		for (let i=0; i<rooms.length; i++) {
			if (rooms[i].RoomId == message.RoomId) {
				rooms[i].Messages.unshift(message.Payload)
				console.log(rooms[i].Messages.length)
			}
		}
	})

	socket.on("roomRequest", (data: RoomRequest, callback: (room: OpenRoom | undefined) => void ) => {
		console.log("Room request from: " + data.RequesterId)
		const room = checkIfRoomExists(data)
		if (!room) {
			callback(undefined)
			return
		}
		console.log(`Owner - ${room.UserId}: Requester - ${data.RequesterId}`)
		if (data.RequesterId == room?.UserId) {
			console.log("Requester is owner")
			callback(room)
			return
		}
		io.to(room.UserId).timeout(10000).emit("roomRequest", data, (err: any, response: string) => {
			if (err) {
				console.log("Owner reply timed out")
				callback(undefined)
			}
			if (response == "accepted") {
				console.log("Owner accepted")
				callback(room)
			} else {
				console.log("Owner rejected")
				callback(undefined)
			}
		})
	})

	socket.on("removeRoom", (data: RoomRequest) => {
		for (let i=0; i<rooms.length; i++) {
			const room = rooms[i]
			if (room.RoomId == data.RoomId) {
				rooms.splice(i, 1)
			}
		}
		socket.emit("getRooms", rooms)
	})

})
