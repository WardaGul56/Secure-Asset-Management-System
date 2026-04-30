create extension postgis;
create extension pgcrypto;

--creating enum types for later use
create type role_type as enum ('admin', 'manager', 'operator');
create type department_type as enum ('logistics', 'security_patrol');
create type scheduled_status_type as enum ('scheduled', 'in_progress', 'done');
create type assignment_status_type as enum ('active', 'completed');

--tables creation
create table users(
	user_id serial primary key,
	name VARCHAR(50) not null,
	email VARCHAR(100) not null unique, 
		constraint email_format check (email like '%_@_%.__%'),
	joining_date date not null default current_date,
	role role_type not null,
	is_active boolean not null default true
);

create table security_admin(
	admin_id varchar(20) primary key,
	user_id int not null unique,
	username VARCHAR(25) not null unique,--check this on how to assign this, and whether it should be added here or in separate table
	foreign key (user_id) references users(user_id)
);
create table fleet_manager(
	manager_id varchar(20) primary key,
	user_id int not null unique,
	username VARCHAR(25) not null unique,--check this on how to assign this, and whether it should be added here or in separate table
	foreign key (user_id) references users(user_id),
	department department_type not null
);
create table operators(
	op_id varchar(20) primary key,
	user_id int not null unique,
	username VARCHAR(25) not null unique,--check this on how to assign this, and whether it should be added here or in separate table
	foreign key (user_id) references users(user_id),
	manager_id varchar(20) not null,
	foreign key (manager_id) references fleet_manager(manager_id),
	active_status boolean not null default false
);
create table passwords(
	username VARCHAR(25) primary key,
	pass_hash varchar(255) not null,
	user_id int not null unique,
	foreign key (user_id) references users(user_id)
);
create table zones(
	zone_id serial primary key,
	zone_name varchar(100) not null,
	boundary GEOMETRY(POLYGON, 4326) not null,
	is_forbidden boolean not null default false,
	created_by varchar(20) not null,
	foreign key (created_by) references security_admin(admin_id)
);
create table asset(
	asset_id serial primary key,
	asset_name varchar(50) not null,
	plate_number varchar(20) not null unique,
	scheduled_status scheduled_status_type not null default 'scheduled' --check this out too
);
create table location_logs(
	log_id serial primary key,
	asset_id int not null,
	op_id varchar(20) not null,
	current_location GEOMETRY(POINT, 4326) not null,
	time_stamp TIMESTAMP not null default current_timestamp,
	foreign key (asset_id) references asset(asset_id),
	foreign key (op_id) references operators(op_id)
);
create table assignments(
	assignment_id serial primary key,
	manager_id varchar(20) not null,
	op_id varchar(20) not null,
	asset_id int not null,
	foreign key (asset_id) references asset(asset_id),
	foreign key (op_id) references operators(op_id),
	foreign key (manager_id) references fleet_manager(manager_id),
	assigned_at timestamp not null default current_timestamp,
	status assignment_status_type not null default 'active' --active or completed
);
create table dummy(
	dummy_id serial primary key,
	asset_name_fake VARCHAR(20),
	location_fake VARCHAR(50)
);

--this connects both databases i.e. Primary Database and Vault Database
create extension postgres_fdw;

create server vault_server
    foreign data wrapper postgres_fdw
    options (host 'localhost', dbname 'Vault Database', port '5432');

create user mapping for postgres
    server vault_server
    options (user 'postgres', password 'pinky2512');

create schema vault_schema;

import foreign schema public
    from server vault_server
    into vault_schema;