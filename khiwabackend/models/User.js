const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  isGoogleAuth: { type: Boolean, default: false },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'gerant', 'comptoiriste', 'client'], required: true },
  isActive: { type: Boolean, default: true },
 

  temporaryToken: String, 
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  profile: {
    firstName: String,
    lastName: String,
   email:String,
    phone: String,
    image: { type: String,}
  
  },
  salon: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon' },


  tokens: [
    {
      token: { type: String, required: true },
    
    },
   
  ],
  cart: [ // Ajoutez ce champ
    {
       offer: { // Nouveau champ pour les offres
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Offer'
    },
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: { type: Number, default: 1 },
        price: { type: Number, required: true } 
      
      
    }
  ]
  

});

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

module.exports = mongoose.model('User', userSchema);