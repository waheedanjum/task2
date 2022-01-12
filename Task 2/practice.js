import * as constants from "./constants";

app.use('url',function(req, res) {
  var invitationBody = req.body
  var shopId = req.params.shopId

  superagent
    .post(constants.AUTH_URL)
    .send(invitationBody)
    .end(async function (err, invitationResponse) {
      if (invitationResponse.status === constants.CREATE) {
        try {
          let createdUser = await User.findOneAndUpdate(
            {
              authId: invitationResponse.body.authId,
            },
            {
              authId: invitationResponse.body.authId,
              email: invitationBody.email,
            },
            {
              upsert: true,
              new: true,
            });

          let shop = await Shop.findById(shopId);
          if (!shop) {
            return res.status(constants.ERROR).send(err || { message: "No shop found" })
          }
          if (shop.invitations && shop.invitations.indexOf(invitationResponse.body.invitationId) === -1) {
            shop.invitations.push(invitationResponse.body.invitationId)
          }
          if (shop.users && shop.users.indexOf(createdUser._id) === -1) {
            shop.users.push(createdUser)
          }
          shop.save()

        }

        catch (err) {
          res.status(constants.ERROR).send(err)
        }
      } else if (invitationResponse.status === constants.SUCCESS) {
        res.status(constants.EXISTS).json({
          error: true,
          message: "User already invited to this shop",
        })
        return
      }
      res.json(invitationResponse)
    })
}

//add try catch to handle any exceptions
//made it a REST API endpoint instead of a function
//changed the old callback methods to use async/await instead, which increased the readability of code
// added checks for shop.invitations and shop.users before looking for a specific id in them, we need to make sure these properties exists otherwise it could lead to an exception
//the condition for invitations would push invitation id if it already exists, changed it to push if it does not already exists
//changed status code from 400 to 409 Conflict, which is the appropriate status code for "Already Exists"
