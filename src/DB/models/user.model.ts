import mongoose, { Types } from "mongoose";
import {
  GenderEnum,
  ProviderEnum,
  RoleEnum,
} from "../../common/enum/user.enum";
import { Hash } from "../../common/utils/security/hash";

export interface IUser {
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  password: string;
  age: number;
  phone: string;
  address?: string;
  gender?: GenderEnum;
  role?: RoleEnum;
  provider?: ProviderEnum;
  confirmed?: boolean;
  changeCredential?: Date;
  createdAt: Date;
  updatedAt: Date;
  profilePicture?: string;
  deletedAt?: Date;
  friends?: Array<Types.ObjectId>;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    provider: {
      type: String,
      enum: ProviderEnum,
      default: ProviderEnum.local,
    },
    password: {
      type: String,
      trim: true,
      minlength: 3,
      required: function () {
        return this.provider !== ProviderEnum.google;
      },
    },
    age: {
      type: Number,
      min: 18,
      max: 100,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      enum: GenderEnum,
      default: GenderEnum.male,
    },
    role: {
      type: String,
      enum: RoleEnum,
      default: RoleEnum.user,
    },
    deletedAt: Date,
    confirmed: Boolean,
    profilePicture: String,
    changeCredential: Date,
    friends: [{ type: Types.ObjectId, ref: "User" }],
  },
  {
    timestamps: true,
    strict: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

userSchema
  .virtual("userName")
  .get(function () {
    return this.firstName + " " + this.lastName;
  })
  .set(function (value: string) {
    this.set({ firstName: value.split(" ")[0], lastName: value.split(" ")[1] });
  });

userSchema.pre("findOne", function () {
  const { paranoid, ...rest } = this.getQuery();
  if (paranoid == false) {
    this.setQuery({ ...rest });
  } else {
    this.setQuery({ ...rest, deletedAt: { $exists: false } });
  }
});

const userModel =
  (mongoose.models.User as mongoose.Model<IUser>) ||
  mongoose.model<IUser>("User", userSchema);

export default userModel;
