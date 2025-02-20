import { Channel } from '../models/Channel'
import { User } from '../models/User'

export const setupDefaultChannels = async () => {
  try {
    // Create admin user if it doesn't exist
    let adminUser = await User.findOne({ email: 'admin@chappy.com' })

    if (!adminUser) {
      adminUser = await User.create({
        username: 'Admin',
        email: 'admin@chappy.com',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        avatarColor: 'text-purple-500'
      })
    }

    // Create default channels if they don't exist
    const defaultChannels = [
      {
        name: 'allmänt',
        description: 'Allmän diskussion för alla användare',
        isPrivate: false
      },
      {
        name: 'nyheter',
        description: 'Nyheter och uppdateringar - endast för registrerade användare',
        isPrivate: true
      }
    ]

    for (const channel of defaultChannels) {
      const exists = await Channel.findOne({ name: channel.name })
      if (!exists) {
        await Channel.create({
          ...channel,
          createdBy: adminUser._id,
          members: [adminUser._id]
        })
      } else if (channel.name === 'allmänt' && exists.isPrivate) {
        // Make sure allmänt is public
        exists.isPrivate = false;
        await exists.save();
        console.log('Updated allmänt channel to be public');
      } else if (channel.name === 'nyheter' && !exists.isPrivate) {
        // Make sure nyheter is private
        exists.isPrivate = true;
        await exists.save();
        console.log('Updated nyheter channel to be private');
      }
    }

    console.log('✅ Default channels have been set up')
  } catch (error) {
    console.error('Error setting up default channels:', error)
  }
}