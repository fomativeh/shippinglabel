module.exports = resetAppState = (appState)=>{
    Object.assign(appState, {
      ...appState,
        courier: "",
        isCreatingLabel: false,
        serviceSpeed: "",
        bulkLabel: false,
        waitingForCsv:false
      })
}