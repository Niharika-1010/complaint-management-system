import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

actor {
  // Types
  type Stats = {
    total : Nat;
    pending : Nat;
    underProcess : Nat;
    completed : Nat;
  };

  type ComplaintData = {
    userId : Principal;
    userName : Text;
    title : Text;
    description : Text;
    category : Category;
    area : Text;
    photoUrl : ?Text;
  };

  public type Category = {
    #water_leakage;
    #drainage;
    #road_damage;
    #garbage;
    #electricity;
    #other;
  };

  module Category {
    public func toText(category : Category) : Text {
      switch (category) {
        case (#water_leakage) { "water_leakage" };
        case (#drainage) { "drainage" };
        case (#road_damage) { "road_damage" };
        case (#garbage) { "garbage" };
        case (#electricity) { "electricity" };
        case (#other) { "other" };
      };
    };

    public func fromText(text : Text) : Category {
      switch (text) {
        case ("water_leakage") { #water_leakage };
        case ("drainage") { #drainage };
        case ("road_damage") { #road_damage };
        case ("garbage") { #garbage };
        case ("electricity") { #electricity };
        case (_) { #other };
      };
    };

    public func compare(a : Category, b : Category) : Order.Order {
      let aText = toText(a);
      let bText = toText(b);
      Text.compare(aText, bText);
    };
  };

  public type ComplaintRequest = {
    title : Text;
    description : Text;
    category : Category;
    area : Text;
    photo : ?Storage.ExternalBlob;
  };

  public type Complaint = {
    id : Nat;
    userId : Principal;
    userName : Text;
    title : Text;
    description : Text;
    category : Text;
    area : Text;
    status : Text;
    assignedWorkerId : ?Principal;
    assignedWorkerName : ?Text;
    photo : ?Storage.ExternalBlob;
    createdAt : Int;
    updatedAt : Int;
  };

  module Complaint {
    public func compareByCategory(a : Complaint, b : Complaint) : Order.Order {
      Text.compare(a.category, b.category);
    };
  };

  public type Worker = {
    principal : Principal;
    name : Text;
  };

  public type UserProfile = {
    name : Text;
    role : Text;
  };

  // State
  let complaints = Map.empty<Nat, Complaint>();
  var nextComplaintId = 0;

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  let userProfiles = Map.empty<Principal, UserProfile>();
  let workers = Map.empty<Principal, Text>();

  // Self-registration: any logged-in user can register as a #user
  public shared ({ caller }) func selfRegister() : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot register");
    };
    // Only register if not already assigned a role
    switch (accessControlState.userRoles.get(caller)) {
      case (?_) {}; // already registered, do nothing
      case (null) {
        accessControlState.userRoles.add(caller, #user);
      };
    };
  };

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (caller.isAnonymous()) { return null };
    // Return null for unregistered users instead of trapping
    switch (accessControlState.userRoles.get(caller)) {
      case (null) { return null };
      case (?_) {};
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Worker Management (Admin only)
  public shared ({ caller }) func addWorker(workerId : Principal, workerName : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can add workers");
    };
    workers.add(workerId, workerName);
  };

  public shared ({ caller }) func removeWorker(workerId : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can remove workers");
    };
    workers.remove(workerId);
  };

  func isWorker(principal : Principal) : Bool {
    switch (workers.get(principal)) {
      case (?_) { true };
      case (null) { false };
    };
  };

  // Invariants
  func verifyStatus(status : Text) : Text {
    if (status != "pending" and status != "under_process" and status != "completed" and status != "rejected") {
      Runtime.trap("Invalid status");
    };
    status;
  };

  // Queries
  public query ({ caller }) func getComplaintById(id : Nat) : async ?Complaint {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view complaints");
    };

    switch (complaints.get(id)) {
      case (?complaint) {
        let isAdmin = AccessControl.isAdmin(accessControlState, caller);
        let isOwner = complaint.userId == caller;
        let isAssignedWorker = switch (complaint.assignedWorkerId) {
          case (?workerId) { workerId == caller };
          case (null) { false };
        };

        if (isAdmin or isOwner or isAssignedWorker) {
          ?complaint;
        } else {
          Runtime.trap("Unauthorized: Cannot view this complaint");
        };
      };
      case (null) { null };
    };
  };

  public query ({ caller }) func getMyComplaints() : async [Complaint] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view complaints");
    };

    complaints.values().toArray().filter(
      func(c) { c.userId == caller }
    );
  };

  public query ({ caller }) func getAssignedComplaints() : async [Complaint] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view complaints");
    };

    if (not isWorker(caller)) {
      Runtime.trap("Unauthorized: Only workers can view assigned complaints");
    };

    complaints.values().toArray().filter(
      func(c) {
        switch (c.assignedWorkerId) {
          case (?workerId) { workerId == caller };
          case (null) { false };
        };
      }
    );
  };

  public query ({ caller }) func getComplaintsByCategory(category : Category) : async [Complaint] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view complaints");
    };

    let categoryText = Category.toText(category);
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);

    complaints.values().toArray().filter(
      func(c) { c.category == categoryText and (isAdmin or c.userId == caller) }
    );
  };

  public query ({ caller }) func getAllComplaints() : async [Complaint] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all complaints");
    };
    complaints.values().toArray();
  };

  public query ({ caller }) func getWorkers() : async [Worker] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view workers");
    };

    let workerList = Map.empty<Principal, Worker>();
    for ((principal, name) in workers.entries()) {
      workerList.add(principal, { principal; name });
    };
    workerList.values().toArray();
  };

  public query ({ caller }) func getStats() : async Stats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view stats");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);

    let filteredComplaints = complaints.values().toArray().filter(
      func(c) { isAdmin or c.userId == caller }
    );

    var pending = 0;
    var underProcess = 0;
    var completed = 0;

    for (complaint in filteredComplaints.values()) {
      switch (complaint.status) {
        case ("pending") { pending += 1 };
        case ("under_process") { underProcess += 1 };
        case ("completed") { completed += 1 };
        case (_) {};
      };
    };

    {
      total = filteredComplaints.size();
      pending;
      underProcess;
      completed;
    };
  };

  // Updates
  public shared ({ caller }) func submitComplaint(request : ComplaintRequest) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit complaints");
    };

    let userProfile = userProfiles.get(caller);
    let userName = switch (userProfile) {
      case (?profile) { profile.name };
      case (null) { caller.toText() };
    };

    let id = nextComplaintId;
    nextComplaintId += 1;

    let timestamp : Int = Time.now();
    let complaint = {
      id;
      userId = caller;
      userName;
      category = Category.toText(request.category);
      title = request.title;
      description = request.description;
      area = request.area;
      status = "pending";
      assignedWorkerId = null;
      assignedWorkerName = null;
      photo = request.photo;
      createdAt = timestamp;
      updatedAt = timestamp;
    };

    complaints.add(id, complaint);
    id;
  };

  public shared ({ caller }) func updateComplaintStatus(complaintId : Nat, status : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update complaints");
    };

    if (not isWorker(caller)) {
      Runtime.trap("Unauthorized: Only workers can update complaint status");
    };

    switch (complaints.get(complaintId)) {
      case (?complaint) {
        let validStatus = verifyStatus(status);

        let isAssigned = switch (complaint.assignedWorkerId) {
          case (?workerId) { workerId == caller };
          case (null) { false };
        };

        if (not isAssigned) {
          Runtime.trap("Unauthorized: Complaint not assigned to you");
        };

        if (validStatus != "under_process" and validStatus != "completed") {
          Runtime.trap("Unauthorized: Workers can only set status to under_process or completed");
        };

        let updatedComplaint = {
          id = complaint.id;
          userName = complaint.userName;
          userId = complaint.userId;
          title = complaint.title;
          description = complaint.description;
          category = complaint.category;
          area = complaint.area;
          status = validStatus;
          assignedWorkerId = complaint.assignedWorkerId;
          assignedWorkerName = complaint.assignedWorkerName;
          photo = complaint.photo;
          createdAt = complaint.createdAt;
          updatedAt = Time.now();
        };

        complaints.add(complaintId, updatedComplaint);
      };
      case (null) { Runtime.trap("Complaint not found") };
    };
  };

  public shared ({ caller }) func assignComplaint(complaintId : Nat, workerId : Principal, workerName : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can assign complaints");
    };

    if (not isWorker(workerId)) {
      Runtime.trap("Invalid worker: Worker not found in registry");
    };

    switch (complaints.get(complaintId)) {
      case (?complaint) {
        let updatedComplaint = {
          id = complaint.id;
          userName = complaint.userName;
          userId = complaint.userId;
          title = complaint.title;
          description = complaint.description;
          category = complaint.category;
          area = complaint.area;
          status = "under_process";
          assignedWorkerId = ?workerId;
          assignedWorkerName = ?workerName;
          photo = complaint.photo;
          createdAt = complaint.createdAt;
          updatedAt = Time.now();
        };

        complaints.add(complaintId, updatedComplaint);
      };
      case (null) { Runtime.trap("Complaint not found") };
    };
  };
};
