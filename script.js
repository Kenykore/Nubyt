const mongoose = require("mongoose")
const bcrypt = require("bcryptjs");
const lodash = require('lodash')
const cloudinary = require('cloudinary').v2;
cloudinary.config({ 
    cloud_name: 'nubyt-co', 
    api_key: '871138731575343', 
    api_secret: '5xQM3wcIBUQNtXg4YZofeVUI3Io' 
  });
let video_id = ["video_posts:5ee9d693fe866f7231aa4824:VID-20200702-WA0050.mp4_Fri Jul 03 2020 14:02:09 GMT+0000 (Coordinated Universal Time)", "video_posts/5ee9d693fe866f7231aa4824/VID-20200624-WA0075.mp4_Fri Jul 03 2020 08:04:47 GMT+0000 (Coordinated Universal Time)", "video_posts:5ee9d693fe866f7231aa4824:VID-20200624-WA0075.mp4_Fri Jul 03 2020 08:04:47 GMT+0000 (Coordinated Universal Time)", "video_posts:5ee9d693fe866f7231aa4824:VID-20200630-WA0002.mp4_Fri Jul 03 2020 07:58:13 GMT+0000 (Coordinated Universal Time)", "video_posts:5ee9d693fe866f7231aa4824:20200624_162026_02.mp4_Fri Jul 03 2020 06:47:42 GMT+0000 (Coordinated Universal Time)", "video_posts:5ee9d693fe866f7231aa4824:Snapchat-519542041.mp4_Thu Jul 02 2020 11:50:02 GMT+0000 (Coordinated Universal Time)"
]
let music_id = ["music_posts:5ee9d693fe866f7231aa4824:osg_E_046.mp3", "music_posts:5ee9d693fe866f7231aa4824:osg_E_049.mp3", "music_posts:5ee9d693fe866f7231aa4824:osg_E_045.mp3_Fri Jul 03 2020 09:14:59 GMT+0000 (Coordinated Universal Time)"
]
let users = [
    {
        username: "kenykore1",
        email: "kenykore1@gmail.com",
        bio: "Friendly and lovely to talk to",
        password: "boluwatife",
        mobile: "+2348133699506",
        name: "Keny Test 1",
        dob: "Jul 02 2020 11:50:02 GMT+0000 ",
        gender: "male",
        activated:true,
        blacklist:[],
        favourites:[]
    },
    {
        username: "kenykore2",
        email: "kenykore2@gmail.com",
        bio: "Friendly and lovely to talk to",
        password: "boluwatife",
        mobile: "+2348133699507",
        name: "Keny Test 2",
        dob: "Jul 02 2020 11:50:02 GMT+0000 ",
        gender: "male",
        activated:true,
        blacklist:[],
        favourites:[]
    },
    {
        username: "kenykore3",
        email: "kenykore3@gmail.com",
        bio: "Friendly and lovely to talk to",
        password: "boluwatife",
        mobile: "+2348133699508",
        name: "Keny Test 3",
        dob: "Jul 02 2020 11:50:02 GMT+0000 ",
        gender: "male",
        activated:true,
        blacklist:[],
        favourites:[]
    },
    {
        username: "kenykore4",
        email: "kenykore4@gmail.com",
        bio: "Friendly and lovely to talk to",
        password: "boluwatife",
        mobile: "+2348133699509",
        name: "Keny Test 4",
        dob: "Jul 02 2020 11:50:02 GMT+0000 ",
        gender: "male",
        activated:true,
        blacklist:[],
        favourites:[]
    },
    {
        username: "kenykore5",
        email: "kenykore5@gmail.com",
        bio: "Friendly and lovely to talk to",
        password: "boluwatife",
        mobile: "+2348133699506",
        name: "Keny Test 5",
        dob: "Jul 02 2020 11:50:02 GMT+0000 ",
        gender: "male",
        activated:true,
        blacklist:[],
        favourites:[]
    }
]
let base_filters = [
    { effect: "volume:-100" }, { effect: "progressbar:bar:yellow:30" },
]
let user_id = []
let overlay_filters = [
    {
        overlay: `lut:filters:aspen.3dl`
    },
    {
        overlay: "lut:filters:humble.3dl"
    },
    {
        overlay: "lut:filters:arapaho.3dl"
    }
]
let filter_effects = [
    {
        effect: "reverse"
    }, {
        effect: "boomerang"
    }, {
        effect: "accelerate:-50"
    }
]
let tags = ["food", "love", "fun", "enjoyment", "football", "travel", "gender"]

async function connectDB(params) {
    try {
        let connc = await mongoose.createConnection("mongodb+srv://kenykore:boluwatife@cluster0-5qrlk.mongodb.net/development?retryWrites=true&w=majority")

        return connc.db
    } catch (error) {
        console.log(error)
    }
}
async function createPost() {
    try {
        console.log("connecting to db")
        let connection = await connectDB()
        let userDB = connection.collection("users")
        let followerDB = connection.collection("user_followers")
        let postDB = connection.collection("posts")
        console.log("beginning user creation to db")
        for (let u of users) {
            const salt = await bcrypt.genSalt(10)
            let password = u.password
            delete u.password
            let user_Created = await userDB.insertOne({
                ...u,
                password: await bcrypt.hash(password, salt),
            })
            console.log(user_Created.insertedId)
            user_id.push(user_Created.insertedId)
            for (let i = 0; i < 3; i++) {
                console.log(`beginning post creation A ${i} for user`,user_Created.insertedId)
                let music_selected = lodash.sample(music_id)
                let selected_filter = lodash.sample(filter_effects)
                let music_filter = { overlay: `video:${music_selected}.mp3`, effect: 'volume:200', start_offset: 0, end_offset: "100p", }
                let filters = [selected_filter, ...base_filters, music_filter]
                let media_id = lodash.sample(video_id)
                let media = cloudinary.url(media_id, { transformation: filters ,secure:true})

                const poster_image = cloudinary.image(media_id,{secure:true})
                console.log(poster_image,"poster image")
                let myRegex =  /<img[^>]+src='?([^"\s]+)'?\s*\/>/g;
                let image=myRegex.exec(poster_image)
                console.log(image,"image array")
                console.log(image[1].slice(0,image[1].length-1),"image")
                //console.log(myRegex.exec(poster_image)[1],"img url")
                let post_to_create = {
                    user_id: user_Created.insertedId.toString(),
                    time: new Date(Date.now()),
                    title: "Hello there",
                    description: `Hello this is a test post A ${i}`,
                    media_id: media_id,
                    poster_image: `${image[1].slice(0,image[1].length-1)}`,
                    sound_id: music_selected,
                    filters: filters,
                    media: media,
                    tags: lodash.sampleSize(tags, 2)
                }
                let post_created = await postDB.insertOne(post_to_create)
                console.log(post_created.ops, "post created with filter 1")
            }
            for (let j = 0; j < 2; j++) {
                console.log(`beginning post creation B ${j} for user`,user_Created.insertedId)
                let music_selected = lodash.sample(music_id)
                let selected_filter = lodash.sample(overlay_filters)
                let music_filter = { overlay: `video:${music_selected}.mp3`, effect: 'volume:200', start_offset: 0, end_offset: "100p", }
                let filters = [selected_filter, ...base_filters, music_filter]
                let media_id = lodash.sample(video_id)
                let media = cloudinary.url(media_id, { transformation: filters,secure:true })
                let poster_image = cloudinary.image(media_id,{secure:true})
                let myRegex =  /<img[^>]+src='?([^"\s]+)'?\s*\/>/g;
                let image=myRegex.exec(poster_image)
                console.log(image,"image array")
                console.log(image[1].slice(0,image[1].length-1),"image")
                let post_to_create = {
                    user_id: user_Created.insertedId.toString(),
                    time: new Date(Date.now()),
                    title: "Hello there",
                    description: `Hello this is a test post B ${j}`,
                    media_id: media_id,
                    poster_image: `${image[1].slice(0,image[1].length-1)}`,
                    sound_id: music_selected,
                    filters: filters,
                    media: media,
                    tags: lodash.sampleSize(tags, 2)
                }
                let post_created = await postDB.insertOne(post_to_create)
                console.log(post_created, "post created with filter 1")
            }
            console.log("ended post creation for user",user_Created.insertedId)
        }
        console.log("ended all post creation");
        console.log("Following users started...")
        for (let u of user_id) {
            let other_users = lodash.sampleSize(user_id.filter(x => x.toString() !== u.toString()),3)
            let followers=[]
            for (let f of other_users) {
                let follower_data = {
                    user_id: u.toString(),
                    follower_id: f.toString(),
                    time: new Date(Date.now())
                }
                followers.push(follower_data)
            }
           let followers_inserted= await followerDB.insertMany(followers)
            console.log(followers_inserted.ops,"followers inserted")
        }
        console.log("Following users ended...")
        return "done"
    } catch (error) {
        console.log(error)
    }
}
createPost().then((res)=>{
    console.log(res)
}).catch(error=>{
    console.log(error)
})