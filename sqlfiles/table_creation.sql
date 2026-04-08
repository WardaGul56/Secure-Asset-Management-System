--creating enum types for future use
create type role_type as enum('admin', 'manager', 'operator');
create type department_type as enum ('logistics', 'security_patrol');
create type scheduled_status_type as enum('scheduled', 'in_progress', 'done');
create type assignment_status_type as enum('active', 'completed');

create table users(
	user_id serial primary key,
	name VARCHAR(50) not null,
	email VARCHAR(50) not null unique, 
		constraint email_format check (email like '%_@_%.__%');
	joining_date date not null default current_date,
	role role_type not null, 
	is_active boolean not null default true
);

create table security_admins(
	admin_id varchar(20) primary key, --check it's datatype
	user_id int not null unique,
	username VARCHAR(25) not null unique,--assigned in backend
	foreign key (user_id) references user(user_id)
);

create table fleet_manager(
	manager_id text primary key unique,
	user_id int,
	username VARCHAR(25),--check this on how to assign this, and whether it should be added here or in separate table
	foreign key (user_id) references user(user_id),
	department enum --check this out too
);

create table operators(
	op_id text primary key unique,
	user_id int,
	username VARCHAR(25),--check this on how to assign this, and whether it should be added here or in separate table
	foreign key (user_id) references user(user_id),
	manager_id text,
	foreign key (manager_id) references fleet_managers (manager_id),
	active status boolean
);

create table passwords(
	username VARCHAR(25) primary key,
	pass_hash varchar(30),
	user_id int,
	foreign key (user_id) references user(user_id)
);

create table zones(
	zone_id int primary key unique,
	zone_name text,
	boundary GEOMETRY(POLYGON, 4326),
	is_forbidden boolean,
	created_by text,
	foreign key (created_by) references security_admin(admin_id)
);

create table asset(
	asset_id int primary key unique,
	asset_name text,
	plate_number text,
	scheduled_status enum --check this out too
);

create table location_logs(
	log_id serial primary key,
	asset_id int,
	op_id text,
	current_location GEOMETRY(POLYGON, 4326),
	time_stamp TIMESTAMP,
	foreign key (asset_id) references asset(asset_id),
	foreign key (op_id) references operators(op_id)
);

create table assignment(
	assignment_id serial primary key,
	manager_id text,
	op_id text,
	asset_id int,
	foreign key (asset_id) references asset(asset_id),
	foreign key (op_id) references operators(op_id),
	foreign key (manager_id) references fleet_managers (manager_id),
	assigned_at timestamp,
	status enum --active or completed
);
create table dummy(
	dummy_id serial primary key,
	asset_name_fake VARCHAR(20),
	location_fake VARCHAR(50)
);