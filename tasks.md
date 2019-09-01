## TODO

- [ ] Consider the case when a component has a client side JS and it is rendered mulitple times in a page (e.g. an item component of the list).
    - Its JS should run per instance.
- [ ] Provide nice development experience.
    - Note that we cannot use webpack-dev-server.
- [ ] Enable to access the counterpart component DOM from client side JS.
    - We can achieve this by providing a unique id via `useClientJS`.
- [ ] Enable to define clean-up function for each client side JS.
    - Let's learn about Mutation Observer.
- [ ] Support nested path for pages definition.
- [ ] Consider the way to let users customize our default webpack config.
- [ ] Provide CLI.
- [ ] More documentation.
